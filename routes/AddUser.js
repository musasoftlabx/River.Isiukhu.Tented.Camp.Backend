// Import libraries
const router = require("express").Router();

const _ = require("lodash");
const randomstring = require("randomstring");

// * Import from schemas
const { usersCollection } = require("../model/schema");

// ? Import Error Handler
const ErrorHandler = require("./controllers/ErrorHandler");

// ? Handle POST method
router.post("/", async (req, res) => {
  const { firstName, lastName, emailAddress, domain } = req.body;

  let username = `${firstName.charAt(0)}${lastName}`;

  const password = randomstring.generate(8);

  let count = await usersCollection.countDocuments({ username });

  if (count === 0) {
    usersCollection.create(
      {
        firstName: _.capitalize(firstName.toLowerCase()),
        lastName: _.capitalize(lastName.toLowerCase()),
        emailAddress: emailAddress.toLowerCase(),
        username: username.toLowerCase(),
        password,
        domain,
      },
      (err, data) => {
        if (err) {
          res.status(400).json(ErrorHandler(err));
        } else {
          res.status(201).json({
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            emailAddress: data.emailAddress,
            domain: data.domain,
            createdAt: data.createdAt,
          });
        }
      }
    );
  } else {
    res.status(401).json({
      subject: "Existing",
      body: "This username already exists",
    });
  }
});

// Export module to app.js
module.exports = router;
