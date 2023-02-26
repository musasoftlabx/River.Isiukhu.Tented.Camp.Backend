// Import libraries
const router = require("express").Router();
const nodemailer = require("nodemailer");

// Handle GET method
router.get("/", async (req, res) => {
  let transporter = nodemailer.createTransport({
    host: "mail.nairochem.com", //mail.privateemail.com for namecheap
    port: 465,
    secure: true,
    auth: {
      user: "repairs@nairochem.com", // admin@imsysafrica.com
      pass: "@Nairo2022#", // Jireh@2022
    },
  });

  let info = await transporter.sendMail({
    from: '"Test Nairochem 👻" <repairs@nairochem.com>',
    //to: "musasoftlabx@gmail.com, brian@nairochem.com, hellena@nairochem.com, jane@nairochem.com", // list of receivers //,
    to: "musasoftlabx@gmail.com", // list of receivers //,
    subject: "Hello there",
    text: "Testing the automated system mai",
    html: "<b>Testing the automated system mail</b>",
  });

  console.log("Message sent: %s", info.messageId);

  res.json({
    message: info.messageId,
  });
});

// Export module to app.js
module.exports = router;
