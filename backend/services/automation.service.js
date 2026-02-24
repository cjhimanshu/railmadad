const cron = require("node-cron");
const Complaint = require("../models/Complaint");

// ─── Department mapping by category ──────────────────────────────────────────
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
  other: "customer_service",
};

// ─── SLA hours by priority ────────────────────────────────────────────────────
const SLA_HOURS = {
  urgent: 4, // must resolve in 4 hours
  high: 24, // 1 day
  medium: 72, // 3 days
  low: 168, // 7 days
};

/**
 * Assign department & SLA deadline when a complaint is created.
 * Called immediately in complaint controller — no delay.
 */
exports.assignDepartmentAndSLA = async (complaint) => {
  const department =
    CATEGORY_DEPARTMENT_MAP[complaint.category] || "customer_service";
  const slaHours = SLA_HOURS[complaint.priority] || 72;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  complaint.assignedDepartment = department;
  complaint.slaDeadline = slaDeadline;
  complaint.automationLog.push({
    action: "AUTO_ASSIGNED",
    details: `Assigned to ${department} department. SLA deadline: ${slaDeadline.toISOString()}. Must resolve within ${slaHours}h.`,
  });

  await complaint.save();
  console.log(
    `✅ [AUTOMATION] Complaint ${complaint._id} → ${department} (SLA: ${slaHours}h)`,
  );
  return complaint;
};

/**
 * Mark pending complaints as in_progress after 30 minutes of no action.
 */
const autoMarkInProgress = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
  const complaints = await Complaint.find({
    status: "pending",
    createdAt: { $lte: cutoff },
  });

  for (const c of complaints) {
    c.status = "in_progress";
    c.automationLog.push({
      action: "AUTO_IN_PROGRESS",
      details:
        "No action taken within 30 minutes. Automatically moved to in_progress.",
    });
    c.lastAutomationCheck = new Date();
    await c.save({ validateBeforeSave: false });
    console.log(
      `🔄 [AUTOMATION] Complaint ${c._id} → in_progress (30min rule)`,
    );
  }
  if (complaints.length)
    console.log(
      `🔄 [AUTOMATION] Marked ${complaints.length} complaint(s) as in_progress`,
    );
};

/**
 * Escalate priority for SLA breaches on in_progress complaints.
 * urgent → stays urgent, high → urgent, medium → high, low → medium
 */
const autoEscalatePriority = async () => {
  const now = new Date();
  const complaints = await Complaint.find({
    status: { $in: ["pending", "in_progress"] },
    slaDeadline: { $lte: now },
    escalatedAt: null, // only escalate once
  });

  const escalationMap = {
    low: "medium",
    medium: "high",
    high: "urgent",
    urgent: "urgent",
  };

  for (const c of complaints) {
    const oldPriority = c.priority;
    c.priority = escalationMap[c.priority];
    c.escalatedAt = now;
    c.automationLog.push({
      action: "AUTO_ESCALATED",
      details: `SLA breach! Priority escalated from ${oldPriority} → ${c.priority}. SLA was ${c.slaDeadline?.toISOString()}.`,
    });
    c.lastAutomationCheck = now;
    await c.save({ validateBeforeSave: false });
    console.log(
      `🚨 [AUTOMATION] Complaint ${c._id} escalated: ${oldPriority} → ${c.priority}`,
    );
  }
  if (complaints.length)
    console.log(`🚨 [AUTOMATION] Escalated ${complaints.length} complaint(s)`);
};

/**
 * Auto-resolve LOW priority complaints that have been in_progress for 7+ days.
 */
const autoResolveLowPriority = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const complaints = await Complaint.find({
    status: "in_progress",
    priority: "low",
    createdAt: { $lte: cutoff },
  });

  for (const c of complaints) {
    c.status = "resolved";
    c.resolvedAt = new Date();
    c.autoResolvedAt = new Date();
    c.adminNotes =
      (c.adminNotes || "") +
      " [AUTO-RESOLVED] Low priority complaint auto-resolved after 7 days.";
    c.automationLog.push({
      action: "AUTO_RESOLVED",
      details:
        "Low priority complaint automatically resolved after 7 days in progress.",
    });
    await c.save({ validateBeforeSave: false });
    console.log(
      `✅ [AUTOMATION] Complaint ${c._id} auto-resolved (low priority, 7 days)`,
    );
  }
  if (complaints.length)
    console.log(
      `✅ [AUTOMATION] Auto-resolved ${complaints.length} low-priority complaint(s)`,
    );
};

/**
 * Auto-reject complaints that have been pending for 30+ days with no action.
 */
const autoRejectStale = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
  const complaints = await Complaint.find({
    status: { $in: ["pending", "in_progress"] },
    createdAt: { $lte: cutoff },
    priority: { $nin: ["urgent", "high"] },
  });

  for (const c of complaints) {
    c.status = "rejected";
    c.automationLog.push({
      action: "AUTO_REJECTED",
      details: "Complaint auto-rejected after 30 days of no resolution.",
    });
    c.lastAutomationCheck = new Date();
    await c.save({ validateBeforeSave: false });
    console.log(
      `❌ [AUTOMATION] Complaint ${c._id} auto-rejected (stale, 30 days)`,
    );
  }
  if (complaints.length)
    console.log(
      `❌ [AUTOMATION] Auto-rejected ${complaints.length} stale complaint(s)`,
    );
};

/**
 * Log automation summary stats every hour
 */
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
    `📊 [AUTOMATION STATS] pending:${pending} | in_progress:${inProgress} | resolved:${resolved} | urgent_active:${urgent}`,
  );
};

/**
 * Start all cron jobs
 */
exports.startAutomation = () => {
  console.log("🤖 [AUTOMATION] Starting automation engine...");

  // Every 5 minutes: mark pending → in_progress
  cron.schedule("*/5 * * * *", async () => {
    try {
      await autoMarkInProgress();
    } catch (e) {
      console.error("[AUTOMATION] autoMarkInProgress error:", e.message);
    }
  });

  // Every 10 minutes: check SLA breaches and escalate
  cron.schedule("*/10 * * * *", async () => {
    try {
      await autoEscalatePriority();
    } catch (e) {
      console.error("[AUTOMATION] autoEscalatePriority error:", e.message);
    }
  });

  // Every hour: auto-resolve old low-priority complaints
  cron.schedule("0 * * * *", async () => {
    try {
      await autoResolveLowPriority();
    } catch (e) {
      console.error("[AUTOMATION] autoResolveLowPriority error:", e.message);
    }
  });

  // Every day at midnight: auto-reject stale complaints
  cron.schedule("0 0 * * *", async () => {
    try {
      await autoRejectStale();
    } catch (e) {
      console.error("[AUTOMATION] autoRejectStale error:", e.message);
    }
  });

  // Every hour: log stats
  cron.schedule("0 * * * *", async () => {
    try {
      await logStats();
    } catch (e) {
      console.error("[AUTOMATION] logStats error:", e.message);
    }
  });

  console.log("✅ [AUTOMATION] Engine running:");
  console.log("   • Every 5 min  → auto in_progress for pending > 30min");
  console.log("   • Every 10 min → escalate SLA-breached complaints");
  console.log("   • Every hour   → auto-resolve old low-priority");
  console.log("   • Daily        → auto-reject stale 30-day complaints");
};
