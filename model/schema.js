// Import libraries
const _ = require("lodash");
const { isEmail } = require("validator");
const dayjs = require("dayjs");

dayjs.extend(require("dayjs/plugin/timezone"));
dayjs.tz.setDefault("Africa/Nairobi");

const today = dayjs().startOf("day").add(3, "hour").toDate();

// Import mongoose & schema from connector
const { mongoose, Schema } = require("./connection");
//const AutoIncrement = require("mongoose-sequence")(mongoose);

// Schema definitions
// This references the collection name as called in the DB

// Devices schema
const devicesSchema = new Schema(
  { device: Object, username: String },
  { versionKey: false }
);

// Roles schema
const rolesSchema = new Schema(
  { role: { type: String, unique: true, set: (v) => _.capitalize(v) } },
  { timestamps: false, versionKey: false }
);

// Departments schema
const departmentsSchema = new Schema(
  { department: { type: String, unique: true, set: (v) => _.capitalize(v) } },
  { timestamps: true, versionKey: false }
);

// Menu schema
const menuSchema = new Schema(
  {
    item: {
      type: String,
      required: [true, "Item must be specified."],
      maxLength: [20, "Item cannot be more than 20 characters."],
      trim: true,
      unique: true,
      set: (v) => _.capitalize(v),
    },
    department: String,
    price: {
      marked: { type: Number, required: [true, "Price must be provided."] },
      sales: { type: Number, required: [true, "Price must be provided."] },
    },
    description: {
      type: String,
      maxLength: [100, "Description must be less than 100 chars."],
    },
    inStock: Boolean,
    images: [String],
    added: { on: { type: Date, default: Date.now }, by: String },
  },
  { timestamps: false, versionKey: false }
);

// Staff schema
const staffSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name must be provided."],
      maxLength: [20, "First name cannot be more than 20 characters."],
      trim: true,
      set: (v) => _.capitalize(v),
    },
    lastName: {
      type: String,
      required: [true, "Last name must be provided."],
      maxLength: [20, "Last name cannot be more than 20 characters."],
      trim: true,
      set: (v) => _.capitalize(v),
    },
    emailAddress: {
      type: String,
      required: [true, "An email must be provided."],
      unique: true,
      lowercase: true,
      validate: [isEmail, "The email provided is not valid."],
    },
    phoneNumber: {
      type: String,
      required: [true, "A phone number must be provided."],
      unique: true,
    },
    username: {
      type: String,
      required: [true, "A username must be provided."],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be greater than 7 characters."],
    },
    role: { type: String, required: true },
    permanent: Boolean,
    photo: String,
    added: { on: { type: Date, default: Date.now }, by: String },
    salary: {
      current: Number,
      payments: [{ transactionID: String, date: Date, amount: Number }],
    },
    checkpoints: [{ checkIn: Date, checkOut: Date, location: String }],
    logins: [Date],
  },
  { collection: "staff" }
);

// Purchases schema
const purchasesSchema = new Schema(
  {
    item: {
      type: String,
      trim: true,
      required: [true, "Item must be specified."],
      set: (v) => _.capitalize(v),
    },
    department: {
      type: String,
      required: [true, "Department must be specified."],
    },
    qty: { type: Number, required: [true, "Qty must be provided."] },
    price: { type: Number, required: [true, "Price must be provided."] },
    paid: Boolean,
    details: { type: String, maxLength: [100, "Must be less than 100 chars."] },
    signature: String,
    purchased: {
      on: { type: Date, default: Date.now },
      from: {
        type: String,
        trim: true,
        required: [true, "Item must be specified."],
        set: (v) => _.capitalize(v),
      },
      by: String,
    },
  },
  { timestamps: false, versionKey: false }
);

// Sales schema
const salesSchema = new Schema(
  {
    items: [
      {
        item: { type: String, trim: true, set: (v) => _.capitalize(v) },
        qty: Number,
        price: Number,
      },
    ],
    department: {
      type: String,
      required: [true, "Department must be specified."],
    },
    guests: { type: Number, required: [true, "Guests must be provided."] },
    bill: { type: Number, required: [true, "Bill must be provided."] },
    paid: Boolean,
    signature: String,
    details: { type: String, maxLength: [100, "Must be less than 100 chars."] },
    billed: { on: { type: Date, default: Date.now }, by: String },
  },
  { timestamps: false, versionKey: false }
);

// Kitchem schema
const kitchenSchema = new Schema(
  {
    item: { type: String, required: [true, "Item must be specified."] },
    opening: { type: Number, required: [true, "Amount must be provided."] },
    closing: Number,
    stocked: { on: { type: Date, default: Date.now }, by: String },
  },
  { timestamps: false, versionKey: false }
);

// Export module to app.js
module.exports = {
  mongoose,
  devicesCollection: mongoose.model("device", devicesSchema),
  rolesCollection: mongoose.model("role", rolesSchema),
  departmentsCollection: mongoose.model("department", departmentsSchema),
  menuCollection: mongoose.model("menu", menuSchema),
  staffCollection: mongoose.model("staff", staffSchema),
  purchasesCollection: mongoose.model("purchase", purchasesSchema),
  salesCollection: mongoose.model("sale", salesSchema),
  kitchenCollection: mongoose.model("kitchen", kitchenSchema),
};
