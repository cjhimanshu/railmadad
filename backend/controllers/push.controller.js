const User = require("../models/User");

// @desc    Save a push subscription for the logged-in user
// @route   POST /api/push/subscribe
// @access  Private
exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid subscription object" });
    }

    // Avoid duplicates — upsert by endpoint
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushSubscriptions: { endpoint } }, // remove if already exists
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { pushSubscriptions: { endpoint, keys } },
    });

    res.status(200).json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a push subscription (user turns off notifications)
// @route   DELETE /api/push/unsubscribe
// @access  Private
exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res
        .status(400)
        .json({ success: false, message: "Endpoint is required" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushSubscriptions: { endpoint } },
    });

    res
      .status(200)
      .json({ success: true, message: "Push subscription removed" });
  } catch (error) {
    next(error);
  }
};

// @desc    Return VAPID public key so the browser can subscribe
// @route   GET /api/push/vapid-public-key
// @access  Public
exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
