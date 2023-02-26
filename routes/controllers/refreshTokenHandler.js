// Import libraries
require("dotenv").config();
const JWT = require("jsonwebtoken");
const redis = require("../../model/redis");

const refreshToken = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?._fc_rt) return res.sendStatus(401);
  const refreshToken = cookies._fc_rt;

  JWT.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
    if (err) return res.sendStatus(403);

    const toSign = {
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      username: decoded.username,
      domain: decoded.domain,
    };

    const accessToken = JWT.sign(toSign, process.env.ACCESS_TOKEN, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });

    redis.set(
      decoded.username,
      refreshToken,
      "EX",
      process.env.REDIS_KEY_EXPIRY
    );

    res.json({ _fc_at: accessToken });
  });
};

// Export module to app.js
module.exports = refreshToken;
