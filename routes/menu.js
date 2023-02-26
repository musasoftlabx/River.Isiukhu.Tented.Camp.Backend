// * Import libraries
const router = require("express").Router();
const fs = require("fs").promises;
const { existsSync } = require("fs");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const formidable = require("formidable");
const dayjs = require("dayjs");
const path = require("path");
const errorhandler = require("errorhandler");

// * Import from schemas
const { menuCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

const uploadDir = "./public/images/menu/";

router.get("/", async (req, res) => {
  const menu = await menuCollection.find().sort({ _id: -1 });
  res.json(menu);
});

router.get("/:id", async (req, res) => {
  menuCollection.findById(
    req.params.id,
    "-_id added salary logins checkpoints",
    (err, data) => {
      if (err) res.sendStatus(500);
      res.json({
        ...data._doc,
        added: {
          ...data._doc.added,
          on: dayjs(data.added.on).format("ddd, DD.MMM.YYYY [at] hh.mm.ss a"),
        },
      });
    }
  );
});

router.post("/", async (req, res) => {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
    filename: (name, ext, part, form) => part.originalFilename,
    filter: ({ mimetype }) => mimetype && mimetype.includes("image"),
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(413).json(ErrorHandler(err, req.url));
      return;
    }

    console.log(fields);

    let { item, department, price, description, inStock } = fields;
    price = JSON.parse(price);

    menuCollection.create(
      {
        item,
        department,
        price: { marked: Number(price.marked), sales: Number(price.sales) },
        description,
        inStock,
        added: { by: req.actioner },
        $push: { images: files.image && files.image.newFilename },
      },
      async (err, data) => {
        if (err) {
          files.image &&
            (await fs.unlink(`${uploadDir}${files.image.newFilename}`));
          res.status(400).json(ErrorHandler(err, path.basename(__filename)));
        } else {
          res.status(201).json(data);
        }
      }
    );
  });
});

router.put("/", async (req, res) => {
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
    filename: (name, ext, part, form) => part.originalFilename,
    filter: ({ mimetype }) => mimetype && mimetype.includes("image"),
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(413).json(ErrorHandler(err, req.url));
      return;
    }

    let { _id, item, department, price, description, inStock } = fields;
    price = JSON.parse(price);

    menuCollection.findByIdAndUpdate(
      _id,
      {
        item,
        department,
        price: { marked: price.marked, sales: price.sales },
        description,
        inStock,
        added: { by: req.actioner },
        $push: {
          images: {
            $each: [files.image && files.image.newFilename],
            $position: 0,
          },
        },
      },
      async (err, data) => {
        if (err) {
          files.image &&
            (await fs.unlink(`${uploadDir}${files.image.newFilename}`));
          res.status(400).json(ErrorHandler(err, path.basename(__filename)));
        } else {
          res.status(201).json(data);
        }
      }
    );
  });
});

router.delete("/:id", async (req, res) => {
  await menuCollection.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
