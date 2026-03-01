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
  seat_occupied_by_other: "security",
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
 * Uses bulkWrite — 1 DB round-trip instead of N saves.
 */
const autoMarkInProgress = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const now = new Date();

  const result = await Complaint.bulkWrite([
    {
      updateMany: {
        filter: { status: "pending", createdAt: { $lte: cutoff } },
        update: {
          $set: { status: "in_progress", lastAutomationCheck: now },
          $push: {
            automationLog: {
              action: "AUTO_IN_PROGRESS",
              details:
                "No action taken within 30 minutes. Automatically moved to in_progress.",
              performedAt: now,
            },
          },
        },
      },
    },
  ]);

  if (result.modifiedCount)
    console.log(
      `🔄 [AUTOMATION] Marked ${result.modifiedCount} complaint(s) as in_progress`,
    );
};

/**
 * Escalate priority for SLA breaches on in_progress complaints.
 * urgent → stays urgent, high → urgent, medium → high, low → medium
 * Uses one bulkWrite with one operation per source-priority level.
 */
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
            details: `SLA breach! Priority escalated from ${from} → ${to}.`,
            performedAt: now,
          },
        },
      },
    },
  }));

  const result = await Complaint.bulkWrite(ops);
  if (result.modifiedCount)
    console.log(
      `🚨 [AUTOMATION] Escalated ${result.modifiedCount} complaint(s)`,
    );
};

/**
 * Auto-resolve LOW priority complaints that have been in_progress for 7+ days.
 */
const autoResolveLowPriority = async () => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const result = await Complaint.bulkWrite([
    {
      updateMany: {
        filter: {
          status: "in_progress",
          priority: "low",
          createdAt: { $lte: cutoff },
        },
        update: {
          $set: {
            status: "resolved",
            resolvedAt: now,
            autoResolvedAt: now,
            lastAutomationCheck: now,
          },
          $push: {
            automationLog: {
              action: "AUTO_RESOLVED",
              details:
                "Low priority complaint automatically resolved after 7 days in progress.",
              performedAt: now,
            },
          },
        },
      },
    },
  ]);

  if (result.modifiedCount)
    console.log(
      `✅ [AUTOMATION] Auto-resolved ${result.modifiedCount} low-priority complaint(s)`,
    );
};

/**
 * Auto-reject complaints that have been pending for 30+ days with no action.
 */
const autoRejectStale = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const result = await Complaint.bulkWrite([
    {
      updateMany: {
        filter: {
          status: { $in: ["pending", "in_progress"] },
          createdAt: { $lte: cutoff },
          priority: { $nin: ["urgent", "high"] },
        },
        update: {
          $set: { status: "rejected", lastAutomationCheck: now },
          $push: {
            automationLog: {
              action: "AUTO_REJECTED",
              details:
                "Complaint auto-rejected after 30 days of no resolution.",
              performedAt: now,
            },
          },
        },
      },
    },
  ]);

  if (result.modifiedCount)
    console.log(
      `❌ [AUTOMATION] Auto-rejected ${result.modifiedCount} stale complaint(s)`,
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
