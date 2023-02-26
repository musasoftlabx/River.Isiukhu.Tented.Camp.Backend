// * Import libraries
const router = require("express").Router();
const fs = require("fs");
const ExcelJS = require("exceljs");
const _ = require("lodash");
const dayjs = require("dayjs");
const path = require("path");
const base64toFile = require("node-base64-to-file");

dayjs.extend(require("dayjs/plugin/utc"));
dayjs.extend(require("dayjs/plugin/timezone"));
dayjs.extend(require("dayjs/plugin/relativeTime"));
dayjs.extend(require("dayjs/plugin/updateLocale"));
dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds ago",
    m: "a minute ago",
    mm: "%d minutes ago",
    h: "an hour ago",
    hh: "%d hours ago",
    d: "a day ago",
    dd: "%d days ago",
    M: "a month ago",
    MM: "%d months ago",
    y: "a year ago",
    yy: "%d years ago",
  },
});
dayjs.tz.setDefault("Africa/Nairobi");

// * Import from schemas
const { salesCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

router.get("/", async (req, res) => {
  /* const { page, limit, from, to } = req.query;
  const start = page * limit; */
  const field = "$bill";

  const min = dayjs("2022-12-01").startOf("day").toDate();
  const max = dayjs("2023-01-31").endOf("day").toDate();

  /* const sales = await salesCollection
    .find({ "billed.on": { $gte: min, $lte: max } })
    .sort({ _id: -1 })
    .skip(start)
    .limit(limit); */

  const daily = await salesCollection.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            date: "$billed.on",
            format: "%Y-%m-%d",
            timezone: process.env.TZ,
          },
        },
        restaurant: {
          $max: {
            bill: {
              $sum: {
                $cond: [{ $eq: ["$department", "Restaurant"] }, "$bill", 0],
              },
            },
            guests: {
              $sum: {
                $cond: [{ $eq: ["$department", "Restaurant"] }, "$guests", 0],
              },
            },
          },
        },
        bar: {
          $max: {
            bill: {
              $sum: {
                $cond: [{ $eq: ["$department", "Bar"] }, "$bill", 0],
              },
            },
            guests: {
              $sum: {
                $cond: [{ $eq: ["$department", "Bar"] }, "$guests", 0],
              },
            },
          },
        },
        accomodation: {
          $max: {
            bill: {
              $sum: {
                $cond: [{ $eq: ["$department", "Accomodation"] }, "$bill", 0],
              },
            },
            guests: {
              $sum: {
                $cond: [{ $eq: ["$department", "Accomodation"] }, "$guests", 0],
              },
            },
          },
        },
        delivery: {
          $max: {
            bill: {
              $sum: {
                $cond: [{ $eq: ["$department", "Delivery"] }, "$bill", 0],
              },
            },
            guests: {
              $sum: {
                $cond: [{ $eq: ["$department", "Delivery"] }, "$guests", 0],
              },
            },
          },
        },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 31 },
  ]);

  const monthly = await salesCollection.aggregate([
    //{ $match: { "billed.on": { $gte: min, $lte: max } } },

    {
      $group: {
        _id: {
          year: { $year: { date: "$billed.on", timezone: process.env.TZ } },
          month: { $month: { date: "$billed.on", timezone: process.env.TZ } },
        },
        restaurant: {
          $sum: { $cond: [{ $eq: ["$department", "Restaurant"] }, field, 0] },
        },
        bar: { $sum: { $cond: [{ $eq: ["$department", "Bar"] }, field, 0] } },
        accomodation: {
          $sum: {
            $cond: [{ $eq: ["$department", "Accomodation"] }, field, 0],
          },
        },
        delivery: {
          $sum: { $cond: [{ $eq: ["$department", "Delivery"] }, field, 0] },
        },
        total: { $sum: field },
        sales: { $sum: 1 },
        //items: { $push: "$items" },
      },
    },
    /* To use later in nested fields 
    { $unwind: { path: "$items" } },
    { $unwind: { path: "$items" } },
    {
      $group: {
        _id: "$_id",
        total: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        count: { $first: "$count" },
        guests: { $first: "$guests" },
        restaurant: { $sum: "$restaurant" },
        //restaurant: "$restaurant",
        bar: { $max: "$bar" },
        accomodation: { $max: "$accomodation" },
        delivery: { $max: "$delivery" },
        //items: { $push: "$items" },
      },
    }, */
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
    {
      $project: {
        _id: 0,
        date: "$_id",
        sales: 1,
        restaurant: 1,
        bar: 1,
        accomodation: 1,
        delivery: 1,
        total: 1,
        //items: 1,
      },
    },
    {
      $addFields: {
        months: [
          "",
          ...Array.from({ length: 12 }, (e, i) =>
            new Date(null, i + 1, null).toLocaleDateString("en", {
              month: "short",
            })
          ),
        ],
      },
    },
    {
      $addFields: {
        month: {
          $concat: [
            { $arrayElemAt: ["$months", "$date.month"] },
            " ",
            { $toString: "$date.year" },
          ],
        },
      },
    },
    { $unset: ["months", "date"] },
  ]);

  const yearly = await salesCollection.aggregate([
    //{ $match: { "billed.on": { $gte: min, $lte: max } } },
    {
      $group: {
        _id: {
          //$month: { date: "$billed.on", timezone: "Africa/Nairobi" },
          $year: { date: "$billed.on" },
        },
        guests: { $sum: "$guests" },
        count: { $count: {} },
        items: { $push: "$items" },
      },
    },
    { $unwind: { path: "$items" } },
    { $unwind: { path: "$items" } },
    {
      $group: {
        _id: "$_id",
        total: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        count: { $first: "$count" },
        guests: { $first: "$guests" },
      },
    },
    { $sort: { _id: -1 } },
    //{ $limit: 6 },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
        total: 1,
        guests: 1,
      },
    },
  ]);

  let barGraphData = [];

  monthly.forEach((item) => {
    barGraphData.push(
      {
        frontColor: "#827717",
        label: dayjs(item.month).format("MMM [`]YY"),
        labelTextStyle: { color: "gray", alignSelf: "center" },
        labelWidth: 70,
        spacing: 2,
        value: item.restaurant,
      },
      { frontColor: "#7e57c2", spacing: 2, value: item.bar },
      {
        frontColor: "#009688",
        spacing: 2,
        value: item.accomodation,
      },
      { frontColor: "#9e9e9e", value: item.delivery }
    );
  });

  res.json({
    // grossCount: _.sumBy(stats, "count"),
    // grossTotal: _.sumBy(stats, "total"),
    daily,
    monthly,
    barGraphData,
  });
});

router.get("/filter", async (req, res) => {
  const { page, limit, from, to, department } = req.query;
  const start = page * limit;

  const min = dayjs(from).startOf("day").toDate();
  const max = dayjs(to).endOf("day").toDate();

  const sales = await salesCollection
    .find({ "billed.on": { $gte: min, $lte: max }, department })
    .sort({ _id: -1 })
    .skip(start)
    .limit(limit);

  const stats = await salesCollection.aggregate([
    { $match: { "billed.on": { $gte: min, $lte: max }, department } },
    {
      $group: {
        _id: { day: { $dayOfYear: "$billed.on" } },
        total: { $sum: "$bill" },
        count: { $sum: 1 },
      },
    },
    //{ $sort: { _id: -1 } },
  ]);

  res.json({
    grossCount: _.sumBy(stats, "count"),
    grossTotal: _.sumBy(stats, "total"),
    stats,
    sales: [
      ...sales.map((item) => ({
        ...item._doc,
        saleID: dayjs(item.billed.on).format("DDMMYYHHmmss"),
        billed: {
          ...item.billed,
          on: dayjs(item.billed.on).fromNow(true),
          by: item.billed.by.split(" ")[0],
        },
      })),
    ],
  });
});

router.get("/export", async (req, res) => {
  const { from, to } = req.query;

  const min = dayjs(from).startOf("day").toDate();
  const max = dayjs(to).endOf("day").toDate();

  const purchases = await purchasesCollection
    .find({ "purchased.on": { $gte: min, $lte: max } })
    .sort({ _id: -1 });

  const stats = await purchasesCollection.aggregate([
    { $match: { "purchased.on": { $gte: min, $lte: max } } },
    {
      $group: {
        _id: { day: { $dayOfYear: "$purchased.on" } },
        total: { $sum: { $multiply: ["$price", "$qty"] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const file = new ExcelJS.Workbook();

  // ? Workbook metadata
  file.creator = "System";
  file.lastModifiedBy = "System";
  file.created = new Date();
  file.modified = new Date();

  // ? Read file
  const workbook = await file.xlsx.readFile(
    "./public/templates/purchases.xlsx"
  );
  const worksheet = workbook.getWorksheet("Sheet1");

  // ? Update cell values

  worksheet.getCell("A1").value = "#";
  worksheet.getCell("B1").value = "Item";
  worksheet.getCell("C1").value = "Department";
  worksheet.getCell("D1").value = "Qty";
  worksheet.getCell("E1").value = "Price";
  worksheet.getCell("F1").value = "Amount";
  worksheet.getCell("G1").value = "Paid";
  worksheet.getCell("H1").value = "Details";
  worksheet.getCell("I1").value = "Purchased From";
  worksheet.getCell("J1").value = "Purchased By";
  worksheet.getCell("K1").value = "Purchased On";

  let startRow = 2;

  purchases.forEach((item, i) => {
    i++;
    worksheet.getCell(`A${startRow}`).value = i;
    worksheet.getCell(`B${startRow}`).value = item.item;
    worksheet.getCell(`C${startRow}`).value = item.department;
    worksheet.getCell(`D${startRow}`).value = item.qty;
    worksheet.getCell(`E${startRow}`).value = item.price;
    worksheet.getCell(`F${startRow}`).value = item.qty * item.price;
    worksheet.getCell(`G${startRow}`).value = item.paid ? "Yes" : "No";
    worksheet.getCell(`H${startRow}`).value = item.details;
    worksheet.getCell(`I${startRow}`).value = item.purchased.from;
    worksheet.getCell(`J${startRow}`).value = item.purchased.by;
    worksheet.getCell(`K${startRow}`).value = dayjs(item.purchased.on).format(
      "ddd, DD MMM YYYY [at] hh:mm:ss a"
    );
    startRow++;
  });

  worksheet.getCell(`E${startRow}:F${_.sumBy(stats, "count")}`).numFmt =
    "[$KES] #,##0.00";

  const startDate = dayjs(from).format("DD.MM.YYYY");
  const endDate = dayjs(to).format("DD.MM.YYYY");
  const fileName = `Purchases.from.${startDate}.to.${endDate}.${dayjs().unix()}.xlsx`;
  const xlsx = `./public/docs/purchases/${fileName}`;
  const url = `${process.env.HOST}${xlsx.replace("./", "")}`;

  // ? Write excel to file
  await workbook.xlsx.writeFile(xlsx);

  setTimeout(() => {
    fs.unlink(xlsx);
  }, 10000);

  res.json({ fileName });
});

router.get("/frequents", async (req, res) => {
  res.json(
    await purchasesCollection.aggregate([
      { $group: { _id: "$item", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
      { $project: { _id: 0, item: "$_id", count: 1 } },
    ])
  );
});

router.post("/", async (req, res) => {
  const { items, department, guests, details, signature } = req.body;

  try {
    let fileName = null;

    if (signature) {
      fileName = await base64toFile(signature, {
        filePath: "./public/images/signatures/",
        randomizeFileNameLength: 10,
        types: ["png"],
      });
    }

    salesCollection.create(
      {
        items,
        department,
        guests,
        bill: items
          .map((item) => item.qty * item.price)
          .reduce((acc, el) => acc + el),
        paid: signature ? false : true,
        details,
        signature: fileName,
        billed: { by: req.actioner },
      },
      async (err, data) => {
        if (err) {
          console.log(err);
          res.status(400).json(ErrorHandler(err, path.basename(__filename)));
        } else {
          res.status(201).json(data);
        }
      }
    );
  } catch (err) {
    res.status(400).json(ErrorHandler(err, path.basename(__filename)));
  }
});

// Export module to app.js
module.exports = router;
