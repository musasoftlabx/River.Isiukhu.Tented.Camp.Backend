// Import libraries
const router = require("express").Router();

// Import from schemas
const { domainsCollection } = require("../model/schema");

// Handle GET method
router.get("/", async (req, res) => {
  res.json(await domainsCollection.distinct("domain"));
});

// Export module to app.js
module.exports = router;
