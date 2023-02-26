// Import libraries
const router = require("express").Router();
const mysql = require("mysql2");

// Handle GET method
router.get("/", async (req, res) => {
  var con = mysql.createConnection({
    host: "139.59.142.199",
    user: "nodeuser",
    password: "@NodeJS2022#",
    database: "4c",
  });

  con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");
    con.query(
      "SELECT * FROM users WHERE username = 'mmuliro'",
      function (err, result, fields) {
        if (err) throw err;
        console.log(result);
      }
    );
  });

  res.send("done");
});

// Export module to app.js
module.exports = router;
