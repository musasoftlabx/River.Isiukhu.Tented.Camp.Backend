// Import libraries
require("dotenv").config();
const router = require("express").Router();
const redis = require("../model/redis");

// Delete key from redis
router.delete("/", (req, res) => {
  redis.del(req.username);
  res.sendStatus(200);
});

// Export module to app.js
module.exports = router;
