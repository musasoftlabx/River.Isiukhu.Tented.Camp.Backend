// Import libraries
const router = require("express").Router();

// Import from controllers
const refreshToken = require("./controllers/refreshTokenHandler");

// Handle GET method
router.get("/", refreshToken);

module.exports = router;
