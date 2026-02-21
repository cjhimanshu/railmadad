const cron = require("node-cron");
const Complaint = require("../models/Complaint");
const ControlUnitDispatch = require("../models/ControlUnitDispatch");

// ─── In-memory queues for batched priorities ──────────────────────────────────
const queues = {
  medium: [], // dispatched every 5 min
  low: [], // dispatched every 10 min
};

const generateBatchId = (priority) =>
  `${priority.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

// ─── Simulate sending to control unit ────────────────────────────────────────
// In production: replace console.log with HTTP POST to actual control system
//                e.g., axios.post(process.env.CONTROL_UNIT_URL, payload)
const sendToControlUnit = async (complaintIds, priority, dispatchType) => {
  const complaints = await Complaint.find({
    _id: { $in: complaintIds },
  }).populate("userId", "name email");

  if (complaints.length === 0) return null;

  const batchId = generateBatchId(priority);

  // Build human-readable summary
  const summaryLines = complaints.map(
    (c, i) =>
      `  ${i + 1}. [${c.category?.toUpperCase()}] "${c.title}" — ${c.priority?.toUpperCase()} — Dept: ${c.assignedDepartment} — User: ${c.userId?.name}`,
  );

  const summary = [
    `━━━ CONTROL UNIT DISPATCH ━━━`,
    `Batch ID : ${batchId}`,
    `Type     : ${dispatchType}`,
    `Priority : ${priority.toUpperCase()}`,
    `Count    : ${complaints.length} complaint(s)`,
    `Time     : ${new Date().toLocaleString("en-IN")}`,
    ``,
    `COMPLAINTS:`,
    ...summaryLines,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");

  // 🔴 LOG TO CONSOLE (this is your "control unit" output)
  console.log("\n" + summary + "\n");

  // Persist dispatch record
  const dispatch = await ControlUnitDispatch.create({
    batchId,
    priority,
    dispatchType,
    complaints: complaintIds,
    complaintCount: complaints.length,
    summary,
    dispatchedAt: new Date(),
  });

  // Mark each complaint as dispatched
  await Complaint.updateMany(
    { _id: { $in: complaintIds } },
    {
      $push: {
        automationLog: {
          action: "DISPATCHED_TO_CONTROL_UNIT",
          details: `Dispatched in batch ${batchId} (${dispatchType}). ${complaints.length} complaint(s) sent.`,
          performedAt: new Date(),
        },
      },
      $set: {
        dispatchedToControlUnit: true,
        dispatchedAt: new Date(),
        dispatchBatchId: batchId,
      },
    },
  );

  return dispatch;
};

// ─── IMMEDIATE dispatch for urgent/high ──────────────────────────────────────
exports.dispatchImmediate = async (complaint) => {
  try {
    if (!["urgent", "high"].includes(complaint.priority)) return;
    console.log(
      `🚨 [CONTROL UNIT] Immediate dispatch for ${complaint.priority.toUpperCase()} complaint: ${complaint._id}`,
    );
    await sendToControlUnit([complaint._id], complaint.priority, "IMMEDIATE");
  } catch (err) {
    console.error("[CONTROL UNIT] dispatchImmediate error:", err.message);
  }
};

// ─── Queue medium/low complaints ─────────────────────────────────────────────
exports.queueForDispatch = (complaintId, priority) => {
  if (priority === "medium" || priority === "low") {
    queues[priority].push(complaintId);
    console.log(
      `📥 [CONTROL UNIT] Queued ${priority} complaint ${complaintId} (queue size: ${queues[priority].length})`,
    );
  }
};

// ─── Batch flush for medium (every 5 min) ────────────────────────────────────
const flushMediumQueue = async () => {
  if (queues.medium.length === 0) return;
  const ids = [...queues.medium];
  queues.medium = [];
  console.log(
    `📦 [CONTROL UNIT] Flushing medium queue: ${ids.length} complaint(s)`,
  );
  await sendToControlUnit(ids, "medium", "BATCH_5MIN");
};

// ─── Batch flush for low (every 10 min) ──────────────────────────────────────
const flushLowQueue = async () => {
  if (queues.low.length === 0) return;
  const ids = [...queues.low];
  queues.low = [];
  console.log(
    `📦 [CONTROL UNIT] Flushing low queue: ${ids.length} complaint(s)`,
  );
  await sendToControlUnit(ids, "low", "BATCH_10MIN");
};

// ─── Recover undispatched complaints on server restart ───────────────────────
const recoverUndispatched = async () => {
  try {
    const undispatched = await Complaint.find({
      dispatchedToControlUnit: { $ne: true },
      status: { $nin: ["resolved", "rejected"] },
    }).select("_id priority");

    for (const c of undispatched) {
      if (c.priority === "urgent" || c.priority === "high") {
        await sendToControlUnit([c._id], c.priority, "IMMEDIATE");
      } else if (c.priority === "medium") {
        queues.medium.push(c._id);
      } else {
        queues.low.push(c._id);
      }
    }

    if (undispatched.length > 0) {
      console.log(
        `🔁 [CONTROL UNIT] Recovered ${undispatched.length} undispatched complaint(s) on restart`,
      );
    }
  } catch (err) {
    console.error("[CONTROL UNIT] recoverUndispatched error:", err.message);
  }
};

// ─── Get current queue status ─────────────────────────────────────────────────
exports.getQueueStatus = () => ({
  mediumQueue: queues.medium.length,
  lowQueue: queues.low.length,
});

// ─── Start control unit scheduler ───────────────────────────────────────────
exports.startControlUnit = async () => {
  console.log("📡 [CONTROL UNIT] Starting control unit dispatcher...");

  // Recover undispatched complaints from before restart
  await recoverUndispatched();

  // Every 5 minutes: flush medium queue
  cron.schedule("*/5 * * * *", async () => {
    try {
      await flushMediumQueue();
    } catch (e) {
      console.error("[CONTROL UNIT] flushMedium error:", e.message);
    }
  });

  // Every 10 minutes: flush low queue
  cron.schedule("*/10 * * * *", async () => {
    try {
      await flushLowQueue();
    } catch (e) {
      console.error("[CONTROL UNIT] flushLow error:", e.message);
    }
  });

  console.log("✅ [CONTROL UNIT] Dispatcher running:");
  console.log("   • Urgent/High → Immediate dispatch on creation");
  console.log("   • Medium      → Batched every 5 minutes");
  console.log("   • Low         → Batched every 10 minutes");
};
