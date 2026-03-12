const User = require("../models/User");

// @desc    Save an FCM registration token for the logged-in user
// @route   POST /api/push/subscribe
// @access  Private
exports.subscribe = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "FCM token is required" });
    }

    // Avoid duplicates — pull then push
    await User.findByIdAndUpdate(req.user.id, { $pull: { fcmTokens: token } });
    await User.findByIdAndUpdate(req.user.id, { $push: { fcmTokens: token } });

    res.status(200).json({ success: true, message: "Push subscription saved" });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove FCM token(s) for the logged-in user
// @route   DELETE /api/push/unsubscribe
// @access  Private
exports.unsubscribe = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (token) {
      // Remove a specific token (single device logout)
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { fcmTokens: token },
      });
    } else {
      // Remove all tokens (full logout)
      await User.findByIdAndUpdate(req.user.id, {
        $set: { fcmTokens: [] },
      });
    }

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
