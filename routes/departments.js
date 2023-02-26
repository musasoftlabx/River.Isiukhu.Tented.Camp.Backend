// Import libraries
const router = require("express").Router();

const _ = require("lodash");

// * Import from schemas
const { departmentsCollection } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  res.json(await departmentsCollection.find().sort({ _id: -1 }));
});

// ? Handle POST method
router.post("/", async (req, res) => {
  departmentsCollection.create(
    { department: req.body.department },
    (err, data) => {
      if (err) res.sendStatus(500);
      res.status(201).json(data);
    }
  );
});

// ? Handle DELETE method(s)
router.delete("/:id", async (req, res) => {
  await departmentsCollection.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
