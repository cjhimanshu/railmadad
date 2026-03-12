const express = require("express");
const { subscribe, unsubscribe } = require("../controllers/push.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/subscribe", protect, subscribe);
router.delete("/unsubscribe", protect, unsubscribe);

module.exports = router;
