/**
 * ai.queue.js
 * ─────────────────────────────────────────────────────────────────────────────
 * BullMQ-based background queue for AI complaint processing.
 * Falls back to setImmediate (in-process async) when Redis is unavailable so
 * the server keeps running without Redis in development.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");

let aiQueue = null;
let redisConnected = false;

// ── Internal: shared AI processing logic (used by both queue worker & fallback)
const processAIJob = async (complaintId, title, description) => {
  // Lazy-require to avoid circular dependency at module load time
  const Complaint = require("../models/Complaint");
  const aiService = require("../services/ai.service");
  const automationService = require("../services/automation.service");
  const controlUnitService = require("../services/controlUnit.service");

  try {
    const aiResults = await aiService.processComplaintWithAI(
      title,
      description || "",
    );

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      {
        category: aiResults.category,
        priority: aiResults.priority,
        sentiment: aiResults.sentiment,
        aiProcessed: true,
        aiSuggestions: {
          suggestedCategory: aiResults.category,
          suggestedPriority: aiResults.priority,
          suggestedResponse: aiResults.suggestedResponse,
          confidence: aiResults.confidence?.category || 0,
        },
      },
      { new: true },
    );

    if (!complaint) return;

    // Re-assign department & SLA now that we have real priority/category
    await automationService.assignDepartmentAndSLA(complaint);

    // Dispatch to control unit based on refined priority
    if (["urgent", "high"].includes(complaint.priority)) {
      await controlUnitService.dispatchImmediate(complaint);
    } else {
      controlUnitService.queueForDispatch(complaint._id, complaint.priority);
    }

    console.log(
      `✅ [AI QUEUE] Complaint ${complaintId} processed — category:${aiResults.category} priority:${aiResults.priority}`,
    );
  } catch (err) {
    console.error(
      `❌ [AI QUEUE] Failed to process complaint ${complaintId}:`,
      err.message,
    );
    // Still mark as processed so it's not stuck in limbo
    try {
      await require("../models/Complaint").findByIdAndUpdate(complaintId, {
        aiProcessed: true,
      });
    } catch (_) {}
  }
};

// ── Initialise queue + worker (called once from server.js after DB connects)
exports.initQueue = async () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  let connection;
  try {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 3000,
    });
    await connection.connect();
    redisConnected = true;
  } catch (err) {
    console.warn(
      "⚠️  [AI QUEUE] Redis unavailable — AI will process asynchronously in-process (setImmediate). " +
        "Set REDIS_URL to enable full BullMQ queuing.",
    );
    if (connection) connection.disconnect();
    return;
  }

  // Producer queue
  aiQueue = new Queue("ai-processing", { connection });

  // Worker — concurrency 20 means 20 AI jobs run in parallel
  const workerConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  new Worker(
    "ai-processing",
    async (job) => {
      const { complaintId, title, description } = job.data;
      await processAIJob(complaintId, title, description);
    },
    {
      connection: workerConnection,
      concurrency: parseInt(process.env.AI_QUEUE_CONCURRENCY) || 20,
    },
  );

  console.log(
    `✅ [AI QUEUE] Redis-backed queue ready (concurrency: ${process.env.AI_QUEUE_CONCURRENCY || 20})`,
  );
};

// ── Enqueue a complaint for AI processing (called from complaint controller)
exports.enqueueAI = async (complaintId, title, description) => {
  if (aiQueue && redisConnected) {
    // Durable, retried job via Redis
    await aiQueue.add(
      "process-complaint",
      { complaintId: complaintId.toString(), title, description },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    );
  } else {
    // Fallback: run in next event-loop tick so HTTP response is sent first
    setImmediate(() =>
      processAIJob(complaintId, title, description).catch(console.error),
    );
  }
};

exports.isQueueReady = () => redisConnected;
