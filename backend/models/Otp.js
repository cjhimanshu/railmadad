const mongoose = require("mongoose");

// Stores temporary OTP codes for mobile-based login.
// TTL index auto-deletes expired documents from MongoDB.
const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB TTL — removes doc automatically
  },
});

module.exports = mongoose.model("Otp", otpSchema);
