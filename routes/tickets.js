// Import libraries
const router = require("express").Router();

const _ = require("lodash");
const dayjs = require("dayjs");
dayjs.extend(require("dayjs/plugin/relativeTime"));
dayjs.extend(require("dayjs/plugin/updateLocale"));

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s ago",
    s: "a few seconds ago",
    m: "a minute ago",
    mm: "%d minutes ago",
    h: "an hour ago",
    hh: "%d hours ago",
    d: "a day ago",
    dd: "%d days ago",
    M: "a month ago",
    MM: "%d months ago",
    y: "a year ago",
    yy: "%d years ago",
  },
});

// * Import from schemas
const { ticketsCollection } = require("../model/schema");

// * Import Error Handler
const ErrorHandler = require("../middleware/ErrorHandler");

// ? Handle GET method
router.get("/", async (req, res) => {
  const tickets = await ticketsCollection.aggregate([
    { $sort: { _id: -1 } },
    {
      $project: {
        _id: 1,
        stage: 1,
        category: 1,
        subcategory: 1,
        details: 1,
        photos: 1,
        createdAt: 1,
        raisedBy: 1,
        forStore: 1,
        quotation: 1,
      },
    },
  ]);

  res.json({
    columns: [
      "",
      "Stage",
      "Category",
      "Sub Category",
      "Raised At",
      "Raised By",
      "Store",
      "View Quote",
    ],
    rows: tickets.map((ticket) => ({
      _id: ticket._id,
      stage: ticket.stage,
      category: ticket.category,
      subcategory: ticket.subcategory,
      details: {
        _: ticket.details,
        expanded: false,
      },
      photos: ticket.photos,
      createdAt: dayjs(ticket.createdAt).format(
        "ddd, DD.MMM.YYYY [at] hh.mm.ss a"
      ),
      raisedBy: ticket.raisedBy,
      forStore: ticket.forStore,
      quotation: {
        url: ticket.quotation.url,
        mailed: ticket.quotation.mailed,
        approved: ticket.quotation.approved,
        comment: ticket.quotation.comment,
      },
      operation: null,
    })),
  });
});

router.get("/:count", async (req, res) => {
  const tickets = await ticketsCollection.aggregate([
    { $sort: { _id: -1 } },
    {
      $project: {
        _id: 1,
        stage: 1,
        category: 1,
        subcategory: 1,
        details: 1,
        quotation: 1,
        photos: 1,
        createdAt: 1,
        raisedBy: 1,
        forStore: 1,
      },
    },
  ]);

  res.json(
    tickets.map((ticket) => ({
      id: ticket._id,
      stage: ticket.stage,
      category: ticket.category,
      subcategory: ticket.subcategory,
      details: {
        _: ticket.details,
        expanded: false,
      },
      quotation: ticket.quotation,
      photos: ticket.photos,
      createdAt: dayjs(ticket.createdAt).fromNow(true),
      raisedBy: ticket.raisedBy,
      forStore: ticket.forStore,
      operation: null,
    }))
  );
});

// ? Handle POST method
router.post("/:id", async (req, res) => {
  const { _id, subcategory } = req.body;

  ticketsCollection.findOneAndUpdate(
    { _id },
    { $addToSet: { subcategories: subcategory } },
    { new: true },
    (err, data) => {
      if (err) res.sendStatus(500);
      res.status(201).json(data);
    }
  );
});

router.post("/", async (req, res) => {
  const { category, subcategory, details, files, store } = req.body;

  ticketsCollection.create(
    {
      category,
      subcategory,
      details,
      photos: files,
      raisedBy: req.actioner,
      forStore: store,
    },
    (err, ticket) => {
      if (err) res.status(400).json(ErrorHandler(err));
      res.status(201).json({
        _id: ticket._id,
        stage: ticket.stage,
        category: ticket.category,
        subcategory: ticket.subcategory,
        details: {
          _: ticket.details,
          expanded: false,
        },
        photos: ticket.photos,
        createdAt: dayjs(ticket.createdAt).format(
          "ddd, DD.MMM.YYYY [at] hh.mm.ss a"
        ),
        raisedBy: ticket.raisedBy,
        forStore: ticket.forStore,
        operation: null,
      });
    }
  );
});

router.put("/", async (req, res) => {
  const { _id, stage } = req.body;

  ticketsCollection.findByIdAndUpdate(_id, { stage }, (err, data) => {
    if (err) res.status(500).json(ErrorHandler(err));
    res.status(201).json(data);
  });
});

router.put("/comments", async (req, res) => {
  const { _, comment } = req.body;

  ticketsCollection.findByIdAndUpdate(
    _,
    { $set: { "quotation.comment": comment } },
    (err, data) => {
      if (err) res.status(500).json(ErrorHandler(err));
      res.status(201).json(data);
    }
  );
});

router.put("/approve", async (req, res) => {
  const { _ } = req.body;

  ticketsCollection.findByIdAndUpdate(
    _,
    { $set: { "quotation.approved": true } },
    (err, data) => {
      if (err) res.status(500).json(ErrorHandler(err));
      res.status(201).json(data);
    }
  );
});

// ? Handle DELETE method(s)
router.delete("/:id", async (req, res) => {
  await ticketsCollection.findByIdAndDelete(req.params.id);
  res.json({});
});

router.delete("/:id/:name", async (req, res) => {
  const x = await ticketsCollection.findById(req.params.id);
  x.subcategories.splice(x.subcategories.indexOf(req.params.name), 1);
  const p = await x.save();
  res.json(p);
});

// Export module to app.js
module.exports = router;
