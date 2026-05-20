const cron = require("node-cron");
const Complaint = require("../models/Complaint");
const logger = require("../utils/logger");
const { sendComplaintProgressUpdate } = require("./complaintTracking.service");

const CATEGORY_DEPARTMENT_MAP = {
  cleanliness: "maintenance",
  safety: "security",
  staff_behavior: "customer_service",
  staff_complaint: "customer_service",
  overcharging: "operations",
  facilities: "maintenance",
  ticketing: "operations",
  punctuality: "operations",
  food_quality: "catering",
  infrastructure: "technical",
  seat_occupied_by_other: "security",
  other: "customer_service",
};

const SLA_HOURS = {
  urgent: 4,
  high: 24,
  medium: 72,
  low: 168,
};

const notifyProgressSafely = async ({ complaint, previousTrackingStatus, previousStatus }) => {
  try {
    await sendComplaintProgressUpdate({
      complaint,
      previousTrackingStatus,
      previousStatus,
    });
  } catch (error) {
    logger.error("[AUTOMATION] notification error:", { message: error.message });
  }
};

exports.assignDepartmentAndSLA = async (complaint) => {
  const department = CATEGORY_DEPARTMENT_MAP[complaint.category] || "customer_service";
  const slaHours = SLA_HOURS[complaint.priority] || 72;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  complaint.assignedDepartment = department;
  complaint.slaDeadline = slaDeadline;
  complaint.automationLog.push({
    action: "AUTO_ASSIGNED",
    details: `Assigned to ${department} department. SLA deadline: ${slaDeadline.toISOString()}. Must resolve within ${slaHours}h.`,
  });

  await complaint.save();
  logger.info(`[AUTOMATION] Complaint assigned`, { id: complaint._id, department, slaHours });
  return complaint;
};

const autoMarkInProgress = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const now = new Date();
  const complaints = await Complaint.find({
    status: "pending",
    createdAt: { $lte: cutoff },
  });

  for (const complaint of complaints) {
    const previousTrackingStatus = complaint.trackingStatus;
    const previousStatus = complaint.status;

    complaint.status = "in_progress";
    complaint.lastAutomationCheck = now;
    if (complaint.trackingStatus === "registered") {
      complaint.trackingStatus = "sent_to_authority";
      complaint.trackingHistory.push({
        stage: "sent_to_authority",
        updatedAt: now,
        note: "Complaint sent to the concerned authority for action.",
      });
    }
    complaint.automationLog.push({
      action: "AUTO_IN_PROGRESS",
      details: "No action taken within 30 minutes. Automatically moved to in_progress.",
      performedAt: now,
    });

    await complaint.save();
    await notifyProgressSafely({
      complaint,
      previousTrackingStatus,
      previousStatus,
    });
  }

  if (complaints.length > 0) {
    console.log(`[AUTOMATION] Marked ${complaints.length} complaint(s) as in_progress`);
  }
};

const autoEscalatePriority = async () => {
  const now = new Date();
  const escalationMap = { low: "medium", medium: "high", high: "urgent" };

  const ops = Object.entries(escalationMap).map(([from, to]) => ({
    updateMany: {
      filter: {
        status: { $in: ["pending", "in_progress"] },
        priority: from,
        slaDeadline: { $lte: now },
        escalatedAt: null,
      },
      update: {
        $set: { priority: to, escalatedAt: now, lastAutomationCheck: now },
        $push: {
          automationLog: {
            action: "AUTO_ESCALATED",
            details: `SLA breach! Priority escalated from ${from} -> ${to}.`,
            performedAt: now,
          },
        },
      },
    },
  }));

  const result = await Complaint.bulkWrite(ops);
  if (result.modifiedCount) {
    console.log(`[AUTOMATION] Escalated ${result.modifiedCount} complaint(s)`);
  }
};

const autoResolveLowPriority = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const complaints = await Complaint.find({
    status: "in_progress",
    priority: "low",
    createdAt: { $lte: cutoff },
  });

  for (const complaint of complaints) {
    const previousTrackingStatus = complaint.trackingStatus;
    const previousStatus = complaint.status;

    complaint.status = "resolved";
    complaint.resolvedAt = now;
    complaint.autoResolvedAt = now;
    complaint.lastAutomationCheck = now;
    complaint.trackingStatus = "resolved";
    complaint.trackingHistory.push({
      stage: "resolved",
      updatedAt: now,
      note: "Complaint resolved automatically after extended processing time.",
    });
    complaint.automationLog.push({
      action: "AUTO_RESOLVED",
      details: "Low priority complaint automatically resolved after 7 days in progress.",
      performedAt: now,
    });

    await complaint.save();
    await notifyProgressSafely({
      complaint,
      previousTrackingStatus,
      previousStatus,
    });
  }

  if (complaints.length > 0) {
    console.log(`[AUTOMATION] Auto-resolved ${complaints.length} low-priority complaint(s)`);
  }
};

const autoRejectStale = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const complaints = await Complaint.find({
    status: { $in: ["pending", "in_progress"] },
    createdAt: { $lte: cutoff },
    priority: { $nin: ["urgent", "high"] },
  });

  for (const complaint of complaints) {
    const previousTrackingStatus = complaint.trackingStatus;
    const previousStatus = complaint.status;

    complaint.status = "rejected";
    complaint.lastAutomationCheck = now;
    complaint.automationLog.push({
      action: "AUTO_REJECTED",
      details: "Complaint auto-rejected after 30 days of no resolution.",
      performedAt: now,
    });

    await complaint.save();
    await notifyProgressSafely({
      complaint,
      previousTrackingStatus,
      previousStatus,
    });
  }

  if (complaints.length > 0) {
    console.log(`[AUTOMATION] Auto-rejected ${complaints.length} stale complaint(s)`);
  }
};

const logStats = async () => {
  const [pending, inProgress, resolved, urgent] = await Promise.all([
    Complaint.countDocuments({ status: "pending" }),
    Complaint.countDocuments({ status: "in_progress" }),
    Complaint.countDocuments({ status: "resolved" }),
    Complaint.countDocuments({
      status: { $in: ["pending", "in_progress"] },
      priority: "urgent",
    }),
  ]);

  console.log(
    `[AUTOMATION STATS] pending:${pending} | in_progress:${inProgress} | resolved:${resolved} | urgent_active:${urgent}`
  );
};

exports.startAutomation = () => {
  console.log("[AUTOMATION] Starting automation engine...");

  cron.schedule("*/5 * * * *", async () => {
    try {
      await autoMarkInProgress();
    } catch (error) {
      console.error("[AUTOMATION] autoMarkInProgress error:", error.message);
    }
  });

  cron.schedule("*/10 * * * *", async () => {
    try {
      await autoEscalatePriority();
    } catch (error) {
      console.error("[AUTOMATION] autoEscalatePriority error:", error.message);
    }
  });

  cron.schedule("0 * * * *", async () => {
    try {
      await autoResolveLowPriority();
    } catch (error) {
      console.error("[AUTOMATION] autoResolveLowPriority error:", error.message);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      await autoRejectStale();
    } catch (error) {
      console.error("[AUTOMATION] autoRejectStale error:", error.message);
    }
  });

  cron.schedule("0 * * * *", async () => {
    try {
      await logStats();
    } catch (error) {
      console.error("[AUTOMATION] logStats error:", error.message);
    }
  });

  console.log("[AUTOMATION] Engine running:");
  console.log("   * Every 5 min  -> auto in_progress for pending > 30min");
  console.log("   * Every 10 min -> escalate SLA-breached complaints");
  console.log("   * Every hour   -> auto-resolve old low-priority");
  console.log("   * Daily        -> auto-reject stale 30-day complaints");
};
