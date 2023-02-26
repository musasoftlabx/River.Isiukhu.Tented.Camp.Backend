// Import libraries
const router = require("express").Router();

const _ = require("lodash");

// * Import from schemas
const { rolesCollection } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("../middleware/ErrorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  res.json(await rolesCollection.find().sort({ _id: -1 }));
});

// ? Handle POST method
router.post("/", async (req, res) => {
  rolesCollection.create({ role: req.body.role }, (err, data) => {
    if (err) res.status(500).json({});
    res.status(201).json(data);
  });
});

router.put("/", async (req, res) => {
  const { category } = req.body;

  const count = await categoriesCollection.countDocuments({ category });

  if (count === 0) {
    categoriesCollection.create(
      { category: _.capitalize(category.toLowerCase()) },
      (err, data) => {
        if (err) {
          res.status(400).json(ErrorHandler(err));
        }
        res.status(201).json({
          _id: data._id,
          category: data.category,
          subcategory: "",
        });
      }
    );
  } else {
    res.status(401).json({
      subject: "Existing",
      body: "This category already exists",
    });
  }
});

// ? Handle DELETE method(s)
router.delete("/:id", async (req, res) => {
  await rolesCollection.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
