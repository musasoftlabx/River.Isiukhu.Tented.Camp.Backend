// Import libraries
require("dotenv").config();
const router = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Import from schemas
const { staffCollection } = require("../model/schema");

// Import logger
const logger = require("../model/logger");
const redis = require("../model/redis");

// ? Handle GET method
router.get("/", async (req, res) => {
  res.json(await staffCollection.find().sort({ _id: -1 }));
});

// ? Handle POST method
router.post("/", (req, res) => {
  const { username, password } = req.body;

  staffCollection
    .findOne({ username })
    .then(async (user) => {
      if (user) {
        if (
          await bcrypt.compare(
            Buffer.from(password, "base64").toString(),
            user.password
          )
        ) {
          const toSign = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
          };

          const accessToken = JWT.sign(toSign, process.env.ACCESS_TOKEN, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
          });

          const refreshToken = JWT.sign(toSign, process.env.REFRESH_TOKEN, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
          });

          redis.set(username, refreshToken, "EX", process.env.REDIS_KEY_EXPIRY);

          res
            /* .cookie("_fc_rt", refreshToken, {
              httpOnly: false,
              secure: false,
              sameSite: "None",
            }) */
            .json({ __aT: accessToken });
        } else {
          throw Error("verification failed");
        }
      } else {
        throw Error("non existent");
      }
    })
    .catch((err) => {
      logger.error({ message: err });
      res.status(401).json(HandleErrors(err));
    });
});

// Handle errors
const HandleErrors = () => {
  return (error = {
    subject: "Incorrect credentials",
    body: "Sorry, we couldn't verify you. Ensure your credentials are specified correctly.",
  });
};

// Export module to app.js
module.exports = router;
