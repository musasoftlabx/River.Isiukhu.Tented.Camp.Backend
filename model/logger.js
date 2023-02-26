require("dotenv").config();
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, prettyPrint } = format;
require("winston-mongodb");

const logger = createLogger({
  //format: format.json(),
  //defaultMeta: { service: "user-service" },
  transports: [
    /* process.env.NODE_ENV !== "production" &&
      new transports.Console({
        level: "info",
        format: combine(format.colorize(), format.simple()),
      }), */

    new transports.File({
      filename: "./logs/error.log",
      level: "error",
      format: combine(timestamp(), prettyPrint()),
    }),

    new transports.File({ filename: "./logs/combined.log" }),

    /* new transports.MongoDB({
      db: process.env.DATABASE_URL,
      options: { useUnifiedTopology: true },
      collection: "logs",
    }), */
  ],
});

module.exports = logger;
