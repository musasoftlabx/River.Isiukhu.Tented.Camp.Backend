// * Import libraries
const router = require("express").Router();
const ExcelJS = require("exceljs");
const dayjs = require("dayjs");

// * Import from schemas
const { salesCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/errorHandler");

// * Handle GET method
router.get("/", async (req, res) => {
  const headerLines = 1;
  const continueOnErrors = false;
  const sheet = 3;

  const file = new ExcelJS.Workbook();

  // ? Read file
  const workbook = await file.xlsx.readFile("./public/sales.xlsx");
  const worksheet = workbook.getWorksheet(`Sheet${sheet}`);
  const numOfRows = worksheet.rowCount - headerLines;

  let errors = [];

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > headerLines) {
      const set = row.values.map((cell, i) =>
        typeof cell === "object" && cell.hasOwnProperty("formula")
          ? cell.result
          : cell
      );
      salesCollection.create(
        {
          items: [{ item: null, qty: 1, price: set[3] }],
          department: set[4],
          guests: set[2],
          bill: set[3],
          paid: set[5] ? false : true,
          signature: null,
          details: set[5] ? `Invoice amount ${set[5]}` : null,
          billed: {
            on: dayjs(set[1]).subtract(3, "hours").toDate(),
            by: "Liztalia Owendi",
          },
        },
        (err, data) => {
          console.log(data);

          if (err) {
            errors.push(err.message);
            if (continueOnErrors) {
              if (rowNumber === numOfRows) {
                res.status(500).json({
                  inserts: rowNumber,
                  errorCount: errors.length,
                  errors,
                });
                return false;
              }
            } else {
              !res.headersSent &&
                res.status(500).json({ errorCount: errors.length, errors });
              return false;
            }
          } else {
            if (rowNumber === numOfRows) {
              res.status(201).json({ inserts: rowNumber, errors });
              return false;
            }
          }
        }
      );
    }
  });
});

// Export module to app.js
module.exports = router;

// console.log(worksheet.getCell("A2").value);
// console.log(worksheet.rowCount);
// console.log(worksheet.columnCount);

/* 
  const alpha = Array.from(Array(26)).map((e, i) => i + 65);
  const alphabet = alpha.map((x) => String.fromCharCode(x));
  console.log(alphabet);
  */
