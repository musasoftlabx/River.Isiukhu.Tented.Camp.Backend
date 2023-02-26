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
const { purchasesCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

router.get("/", async (req, res) => {
  const { page, limit, from, to } = req.query;
  const start = page * limit;

  const min = dayjs(from).startOf("day").toDate();
  const max = dayjs(to).endOf("day").toDate();

  const purchases = await purchasesCollection
    .find({ "purchased.on": { $gte: min, $lte: max } })
    .sort({ _id: -1 })
    .skip(start)
    .limit(limit);

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

  res.json({
    grossCount: _.sumBy(stats, "count"),
    grossTotal: _.sumBy(stats, "total"),
    stats,
    purchases: [
      ...purchases.map((item) => ({
        ...item._doc,
        purchased: {
          ...item.purchased,
          on: dayjs(item.purchased.on).fromNow(true),
          by: item.purchased.by.split(" ")[0],
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
  const { item, department, qty, price, seller, details, signature } = req.body;

  try {
    let fileName = null;

    if (signature) {
      fileName = await base64toFile(signature, {
        filePath: "./public/images/signatures/",
        randomizeFileNameLength: 10,
        types: ["png"],
      });
    }

    purchasesCollection.create(
      {
        item,
        department,
        qty,
        price,
        paid: signature ? false : true,
        details,
        signature: fileName,
        purchased: { from: seller, by: req.actioner },
      },
      async (err, data) => {
        if (err) {
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
