// * Import libraries
const router = require("express").Router();
const fs = require("fs").promises;
const _ = require("lodash");
const bcrypt = require("bcrypt");
const formidable = require("formidable");
const dayjs = require("dayjs");
const path = require("path");

// * Import from schemas
const { staffCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

const uploadDir = "./public/images/photos/";

router.get("/", async (req, res) => {
  const staff = await staffCollection.aggregate([
    { $sort: { _id: -1 } },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        username: 1,
        emailAddress: 1,
        phoneNumber: 1,
        role: 1,
        permanent: 1,
        photo: 1,
      },
    },
  ]);

  res.json({
    rows: staff.map((one) => ({ ...one, pressed: false })),
  });
});

router.get("/:id", async (req, res) => {
  staffCollection.findById(
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
    maxFileSize: 5 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
    filter: ({ mimetype }) => mimetype && mimetype.includes("image"),
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }

    const {
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      salary,
      role,
      permanent,
    } = fields;

    let username = `${firstName.charAt(0)}${lastName}`.toLowerCase();

    const passkey = firstName; // randomstring.generate(8);

    const password = await bcrypt.hash(passkey, 10);

    const count = await staffCollection.countDocuments({ username });

    const AddStaff = (username) => {
      staffCollection.create(
        {
          firstName: _.capitalize(firstName.toLowerCase()),
          lastName: _.capitalize(lastName.toLowerCase()),
          emailAddress: emailAddress.toLowerCase(),
          phoneNumber,
          username,
          password,
          role,
          salary: { current: Number(salary) },
          permanent,
          photo: files.image && files.image.newFilename,
          added: { by: req.actioner },
        },
        async (err, data) => {
          if (err) {
            files.image &&
              (await fs.unlink(`${uploadDir}${files.image.newFilename}`));
            res.status(400).json(ErrorHandler(err, path.basename(__filename)));
          } else {
            res.sendStatus(201);
          }
        }
      );
    };

    count === 0 ? AddStaff(username) : AddStaff(username + count);
  });
});

router.delete("/:file", async (req, res) => {
  await fs.unlink(`${uploadDir}${req.params.file}`);
  res.sendStatus(204);
});

// Export module to app.js
module.exports = router;
