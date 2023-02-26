// Import libraries
const router = require("express").Router();

const _ = require("lodash");

// * Import from schemas
const { kitchenCollection, dayjs } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  const data = await kitchenCollection
    .find({
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$$NOW" } },
          { $dateToString: { format: "%Y-%m-%d", date: "$stocked.on" } },
        ],
      },
    })
    .sort({ _id: -1 });

  console.log(
    /* [
      ...data.map((item) => ({
        ...item._doc,
        stocked: {
          ...item.stocked,
          on: dayjs(item.stocked.on).format(true),
          by: item.billed.by.split(" ")[0],
        },
      })),
    ] */
    /* {
    ...data,
    stocked: {
      ...data.stocked,
      on: dayjs(...data.stocked.on).format("DD.MM.YYYY"),
    },
  } */
    dayjs
  );

  res.json(data);
});

// ? Handle POST method
router.post("/", async (req, res) =>
  kitchenCollection.create(
    { ...req.body, stocked: { by: req.actioner } },
    (err, data) => {
      if (err) res.sendStatus(500);
      res.status(201).json(data);
    }
  )
);

router.put("/", async (req, res) => {
  const { _id, closing } = req.body;
  await kitchenCollection.findByIdAndUpdate(_id, { closing });
  res.sendStatus(200);
});

// ? Handle DELETE method(s)
router.delete("/:id", async (req, res) => {
  await kitchenCollection.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
