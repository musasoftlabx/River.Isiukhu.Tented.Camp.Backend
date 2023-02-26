// Import libraries
const router = require("express").Router();

// * Import from schemas
const { storesCollection } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("./controllers/ErrorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  const stores = await storesCollection.aggregate([
    { $sort: { _id: -1 } },
    {
      $project: {
        code: 1,
        name: 1,
        country: 1,
        client: 1,
      },
    },
  ]);

  res.json({
    columns: ["Code", "Name", "Country", "Client", "Operation"],
    rows: stores.map((store) => ({
      _id: store._id,
      code: store.code,
      name: store.name,
      country: store.country,
      client: store.client,
      operation: null,
    })),
  });
});

// ? Handle POST method
router.post("/", async (req, res) => {
  const {
    code,
    name,
    country: { code: countryCode, label },
    client,
  } = req.body;

  let count = await storesCollection.countDocuments({ code });

  if (count === 0) {
    storesCollection.create(
      {
        code: countryCode + code,
        name,
        country: label,
        client,
      },
      (err, data) => {
        if (err) {
          res.status(400).json(ErrorHandler(err));
        } else {
          res.status(201).json(data);
        }
      }
    );
  } else {
    res.status(401).json({
      subject: "Existing",
      body: "This store already exists",
    });
  }
});

// ? Handle DELETE method
router.delete("/:id", async (req, res) => {
  await storesCollection.findByIdAndDelete(req.params.id);
  res.json({});
});

// Export module to app.js
module.exports = router;
