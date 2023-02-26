// Import libraries
const _ = require("lodash");

const logger = require("../model/logger");

const ErrorHandler = (e, service) => {
  let error = {};

  // Object ID error
  if (e.message.includes("Cast to ObjectId failed")) {
    error = {
      subject: "System Error",
      body: "_id could not be verified.",
    };
  }

  // Mandatory field error
  if (e.message.includes("is required")) {
    error["subject"] = "Mandatory Error";
    Object.values(e.errors).forEach(({ properties }) => {
      error["body"] = `${_.capitalize(properties.path)} field is mandatory.`;
    });
  }

  // Validation error
  if (e.message.includes("maximum allowed length")) {
    error["subject"] = "Validation Error";
    Object.values(e.errors).forEach(({ properties }) => {
      error["body"] = `${properties.value} is longer than the required length.`;
    });
  }

  // Item not found error
  if (e.message.includes("not found")) {
    error = {
      subject: "Item missing",
      body: "This item does not exist in our records.",
    };
  }

  // Duplicate error
  if (e.code === 11000) {
    let field = _.lowerCase(_.findLastKey(_.last(_.values(e))));
    let value = _.head(_.values(_.last(_.values(e))));
    error["subject"] = `Duplicate Error`;
    error["body"] = `${value} already exists. Kindly try another ${field}.`;
  }

  // File upload max size error
  if (e.code === 1009) {
    error = {
      subject: "Max size exceeded",
      body: "Maximum file size was exceeded. Kindly upload a file with size lower than specified",
    };
  }

  // logger call
  logger.error({ message: { ...error }, service });

  return { ...error, status: "error" };
};

module.exports = ErrorHandler;
