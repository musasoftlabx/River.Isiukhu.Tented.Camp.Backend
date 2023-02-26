// * Import libraries
const router = require("express").Router();
const fs = require("fs").promises;

const formidable = require("formidable");
const dayjs = require("dayjs");

// * Import from schemas
const { ticketsCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/ErrorHandler");

const uploadDir = "./public/images/snapshots/";

router.post("/", async (req, res) => {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
    filter: ({ mimetype }) => mimetype && mimetype.includes("image"),
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }
    console.log(fields);
    res.json(files);
  });
});

router.delete("/:file", async (req, res) => {
  await fs.unlink(`${uploadDir}${req.params.file}`);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
