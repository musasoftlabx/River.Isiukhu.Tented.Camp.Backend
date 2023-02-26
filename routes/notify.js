// * Import libraries
const router = require("express").Router();
const admin = require("firebase-admin");
const fcm = require("@diavrank/fcm-notification");
const serviceAccount = require("../certs/firebase-cert.json");
const certPath = admin.credential.cert(serviceAccount);
const FCM = new fcm(certPath);

router.get("/", (req, res) => {
  try {
    FCM.send(
      {
        android: {
          notification: {
            title: "NodeJSX",
            body: "A module in node js",
          },
        },
        token:
          "em3o9PgrRXehpZ0CXdj7Hj:APA91bFBY6lziplYLvDrZBlN0m0d1jmsMs8Xl9GUvmb__0OGmbB-b3VB0chPJH_P5GbsSUeFOAEFO6lk_YtP-xh-WnO6myy1Vhe70KkK2ONaWyiLQYQVtLWf9kXJc13yjd7yj6RdJCxe",
      },
      (err, resp) => {
        if (err) {
          throw err;
        } else {
          res.json({ msg: resp });
        }
      }
    );
  } catch (err) {
    throw err;
  }
});

// Export module to app.js
module.exports = router;
