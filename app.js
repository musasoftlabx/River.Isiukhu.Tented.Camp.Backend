process.env.TZ = "Africa/Nairobi";
//process.env.TZ = "America/New_York";
const fs = require("fs");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const errorhandler = require("errorhandler");

// * Import Error Handler
const ErrorHandler = require("./middleware/errorHandler");

// Import connection
const { express, app } = require("./model/connection");
const verifyToken = require("./middleware/verifyToken");

// Create log file if it doesn't exist
fs.access("./logs/access.log", fs.F_OK, (err) => {
  if (err) {
    fs.mkdir("./logs", { recursive: true }, (err) => {
      if (err) console.log("Error creating logs folder");
      fs.open("./logs/access.log", "w", (err) => {
        if (err) if (err) console.log("Error creating access.log");
      });
    });
  }
});

// Register Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.static("/public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: fs.createWriteStream("./logs/access.log", {
      flags: "a",
    }),
  })
);

//app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use("*/public", express.static("public"));

// Auto-process
app.use("/", (req, res, next) => next());

// Routes
app.use("/login", require("./routes/login"));
app.use("/refresh", require("./routes/refresh"));
app.use("/test", (req, res) => res.json({ date: dayjs().add(3, "hour") }));
app.use("/notify", require("./routes/notify"));
app.use("/upload", require("./routes/upload"));
app.use("/ReadExcel", require("./routes/ReadExcel"));
app.use(verifyToken);
app.use("/staff", require("./routes/staff"));
app.use("/roles", require("./routes/roles"));
app.use("/departments", require("./routes/departments"));
app.use("/menu", require("./routes/menu"));
app.use("/purchases", require("./routes/purchases"));
app.use("/sales", require("./routes/sales"));
app.use("/kitchen", require("./routes/kitchen"));

// Error management
//app.use(errorhandler({ log: false }));
app.use((req, res) => res.status(404).json({ error: 404 }));
