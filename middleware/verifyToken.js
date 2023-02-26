require("dotenv").config();
const JWT = require("jsonwebtoken");
const redis = require("../model/redis");

// Import from schemas
const { devicesCollection } = require("../model/schema");

const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.sendStatus(401);
  const token = header.split(" ")[1];

  JWT.verify(token, process.env.ACCESS_TOKEN, (err, decodedToken) => {
    if (err) {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );

      redis.exists(payload.username, (error, exists) => {
        if (exists === 1) {
          const toSign = {
            firstName: payload.firstName,
            lastName: payload.lastName,
            username: payload.username,
            domain: payload.domain,
          };

          req.accessToken = JWT.sign(toSign, process.env.ACCESS_TOKEN, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
          });
          next();
        } else {
          res.status(403).json({ forceLogout: true });
        }
      });
    } else {
      req.decodedToken = decodedToken;
      req.actioner = `${decodedToken.firstName} ${decodedToken.lastName}`;
      req.username = `${decodedToken.username}`;
      req.deviceInfo = JSON.parse(req.headers.deviceinfo);

      devicesCollection.create({
        username: req.username,
        device: req.deviceInfo,
      });

      next();
    }
  });
};

module.exports = verifyToken;

/* const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.sendStatus(401);
  const token = header.split(" ")[1];
  JWT.verify(token, process.env.ACCESS_TOKEN, (err, decodedToken) => {
    if (err) return res.sendStatus(403);
    req.decodedToken = decodedToken;
    req.modifiedBy = `${decodedToken.firstName} ${decodedToken.lastName}`;
    req.username = `${decodedToken.username}`;
    next();
  });
}; */
