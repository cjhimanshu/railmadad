const mongoose = require("mongoose");

const controlUnitDispatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true },
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      required: true,
    },
    dispatchType: {
      type: String,
      enum: ["IMMEDIATE", "BATCH_5MIN", "BATCH_10MIN"],
      required: true,
    },
    complaints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],
    complaintCount: { type: Number, default: 0 },
    summary: { type: String }, // auto-generated summary sent to control unit
    dispatchedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }, // control unit acknowledged
    acknowledgedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "ControlUnitDispatch",
  controlUnitDispatchSchema,
);
