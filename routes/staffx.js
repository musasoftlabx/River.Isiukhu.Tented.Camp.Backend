// Import libraries
const router = require("express").Router();

const bcrypt = require("bcrypt");
const dayjs = require("dayjs");
const _ = require("lodash");
const randomstring = require("randomstring");
const fs = require("fs").promises;
const formidable = require("formidable");

// * Import from schemas
const { staffCollection } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("./controllers/ErrorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  console.log(req.cookies);

  const users = await staffCollection.aggregate([
    { $sort: { _id: -1 } },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        username: 1,
        emailAddress: 1,
        role: 1,
        added: 1,
      },
    },
  ]);

  res.json({
    rows: users.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      domain: user.domain,
      //addedOn: dayjs(user.added.on).format("ddd, DD.MMM.YYYY [at] hh.mm.ss a"),
      //addedBy: user.added.by,
    })),
  });
});

// ? Handle POST method
router.post("/", async (req, res) => {
  const form = formidable({
    uploadDir: "./public/images/snapsots/",
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    maxTotalFileSize: 20 * 1024 * 1024,
    filter: ({ mimetype }) => mimetype && mimetype.includes("image"),
  });

  form.parse(req, async (err, fields, files) => {
    /*  if (err) {
      next(err);
      return;
    } */
    console.log(fields);
    res.json(files);

    /* const {
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
        },
        (err, data) => {
          if (err) {
            res.status(400).json(ErrorHandler(err));
          } else {
            res.sendStatus(201);
          }
        }
      );
    };

    count === 0 ? AddStaff(username) : AddStaff(username + count); */
  });
});

// ? Handle DELETE method
router.delete("/:id", async (req, res) => {
  await staffCollection.findByIdAndDelete(req.params.id);
  res.json({});
});

// Export module to app.js
module.exports = router;
