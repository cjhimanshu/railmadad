const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    title: {
      type: String,
      required: [true, "Please provide a complaint title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
      default: "",
    },
    category: {
      type: String,
      enum: [
        "cleanliness",
        "safety",
        "staff_behavior",
        "staff_complaint",
        "overcharging",
        "facilities",
        "ticketing",
        "punctuality",
        "food_quality",
        "infrastructure",
        "seat_occupied_by_other",
        "other",
      ],
      default: "other",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "rejected"],
      default: "pending",
    },
    // 4-level public tracking status
    trackingStatus: {
      type: String,
      enum: [
        "registered",
        "sent_to_authority",
        "authority_taken_action",
        "resolved",
      ],
      default: "registered",
    },
    trackingHistory: [
      {
        stage: {
          type: String,
          enum: [
            "registered",
            "sent_to_authority",
            "authority_taken_action",
            "resolved",
          ],
        },
        updatedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
    pnrNumber: {
      type: String,
      trim: true,
      required: [true, "Please provide your PNR number"],
      match: [/^\d{10}$/, "PNR number must be exactly 10 digits"],
    },
    trainNumber: {
      type: String,
      trim: true,
      default: null,
    },
    contactMobile: {
      type: String,
      trim: true,
      required: [true, "Please provide your mobile number"],
      match: [/^\d{10}$/, "Mobile number must be a 10-digit number"],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    imageURL: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },
    aiSuggestions: {
      suggestedCategory: String,
      suggestedPriority: String,
      suggestedResponse: String,
      confidence: Number,
    },
    assignedDepartment: {
      type: String,
      enum: [
        "maintenance",
        "security",
        "customer_service",
        "catering",
        "operations",
        "technical",
        "unassigned",
      ],
      default: "unassigned",
    },
    adminNotes: {
      type: String,
      maxlength: [1000, "Admin notes cannot be more than 1000 characters"],
    },
    resolvedAt: {
      type: Date,
    },
    // Automation tracking
    automationLog: [
      {
        action: String,
        performedAt: { type: Date, default: Date.now },
        details: String,
      },
    ],
    escalatedAt: { type: Date },
    autoResolvedAt: { type: Date },
    lastAutomationCheck: { type: Date },
    slaDeadline: { type: Date }, // when it must be resolved by
    // Control unit dispatch tracking
    dispatchedToControlUnit: { type: Boolean, default: false },
    dispatchedAt: { type: Date },
    dispatchBatchId: { type: String },

    // ─── Two-step closure verification ───────────────────────────────
    authorityMarkedDone: { type: Boolean, default: false },
    authorityMarkedAt: { type: Date },
    authorityActionNotes: { type: String, trim: true }, // what action was taken

    customerMarkedDone: { type: Boolean, default: false },
    customerMarkedAt: { type: Date },

    // ─── User satisfaction ────────────────────────────────────────────
    // 1=Very Dissatisfied, 2=Dissatisfied, 3=Neutral, 4=Satisfied, 5=Very Satisfied
    satisfactionRating: { type: Number, min: 1, max: 5, default: null },
    satisfactionComment: { type: String, trim: true, default: null },
    satisfactionSubmittedAt: { type: Date },

    // blocked = authority marked done but user gave low rating or rejected closure
    closureBlocked: { type: Boolean, default: false },
    closureBlockedReason: { type: String },

    // ─── AI processing flag ───────────────────────────────────────────────────
    // false until the background AI queue worker has finished processing
    aiProcessed: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Single-field
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ pnrNumber: 1 });
complaintSchema.index({ contactEmail: 1 });
complaintSchema.index({ contactMobile: 1 });

// Compound — cover the most common admin & cron query patterns
complaintSchema.index({ status: 1, createdAt: -1 }); // admin list + cron
complaintSchema.index({ status: 1, priority: 1 }); // urgent/high filter
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 }); // combined admin filter
complaintSchema.index({ assignedDepartment: 1, status: 1 }); // department filter
complaintSchema.index({ slaDeadline: 1, status: 1, escalatedAt: 1 }); // SLA escalation cron
complaintSchema.index({ category: 1, status: 1 }); // category analytics
complaintSchema.index({ trackingStatus: 1, createdAt: -1 }); // public tracking queries
complaintSchema.index({ dispatchedToControlUnit: 1, status: 1 }); // control unit dispatch queries
complaintSchema.index({ trackingStatus: 1, createdAt: -1 }); // public tracking

module.exports = mongoose.model("Complaint", complaintSchema);
