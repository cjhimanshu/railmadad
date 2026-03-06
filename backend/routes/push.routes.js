const express = require("express");
const {
  subscribe,
  unsubscribe,
  getVapidPublicKey,
} = require("../controllers/push.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/vapid-public-key", getVapidPublicKey);
router.post("/subscribe", protect, subscribe);
router.delete("/unsubscribe", protect, unsubscribe);

module.exports = router;
