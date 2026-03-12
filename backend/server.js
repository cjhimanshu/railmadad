require("dotenv").config();

// ── Clustering: one worker per CPU in production ──────────────────────────────
const cluster = require("cluster");
const os = require("os");

if (process.env.NODE_ENV === "production" && cluster.isPrimary) {
  const numCPUs = parseInt(process.env.WEB_CONCURRENCY) || os.cpus().length;
  console.log(`🖥️  Primary ${process.pid} → spawning ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `⚠️  Worker ${worker.process.pid} died (${signal || code}) — restarting`,
    );
    cluster.fork();
  });
  return; // Primary only manages workers; workers run the actual server
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db.config");
const errorHandler = require("./middleware/error.middleware");
const { startAutomation } = require("./services/automation.service");
const { startControlUnit } = require("./services/controlUnit.service");
const { initQueue } = require("./queues/ai.queue");

// Seed the fixed admin account on startup
async function seedAdmin() {
  try {
    const User = require("./models/User");
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.warn(
        "⚠️ Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env",
      );
      return;
    }

    const existing = await User.findOne({ email: adminEmail }).select(
      "+password",
    );
    if (existing) {
      // Ensure role is admin and password is up to date
      const hasPasswordHash =
        typeof existing.password === "string" && existing.password.length > 0;
      const match = hasPasswordHash
        ? await bcrypt.compare(adminPassword, existing.password)
        : false;
      if (!match || existing.role !== "admin") {
        existing.password = await bcrypt.hash(adminPassword, 10);
        existing.role = "admin";
        existing.isActive = true;
        await existing.save();
        console.log("✅ Admin account updated");
      } else {
        console.log("✅ Admin account ready");
      }
    } else {
      await User.create({
        name: "Railway Admin",
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 10),
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin account created:", adminEmail);
    }
  } catch (err) {
    console.error("❌ Admin seed error:", err.message);
  }
}

// Import routes
const authRoutes = require("./routes/auth.routes");
const complaintRoutes = require("./routes/complaint.routes");
const adminRoutes = require("./routes/admin.routes");

// Initialize app
const app = express();

// Trust Render's proxy (required for express-rate-limit behind a reverse proxy)
app.set("trust proxy", 1);

// Connect to database
connectDB().then(async () => {
  // Seed fixed admin account
  await seedAdmin();
  // Start automation engine & control unit only on worker 1 (or in dev)
  // This prevents N workers from each running cron jobs
  if (!cluster.isWorker || cluster.worker.id === 1) {
    startAutomation();
    await startControlUnit();
  }
  // Initialise AI processing queue (connects to Redis if available)
  await initQueue();
});

// Middleware
app.use(compression()); // gzip all responses
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowed = [
        process.env.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
      ].filter(Boolean);

      // Allow any Vercel preview/production URL for this project
      const isVercel =
        origin.endsWith(".vercel.app") || origin.includes("railmadad");

      if (allowed.includes(origin) || isVercel) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});
const complaintLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message:
      "Complaint submission limit reached. Please wait before submitting again.",
  },
});

app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "RailMadad API - AI-Integrated Railway Complaint Management System",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/complaints", complaintLimiter, complaintRoutes);
app.use("/api/admin", adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Trying port ${parseInt(PORT) + 1}...`,
    );
    server.close();
    app.listen(parseInt(PORT) + 1, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${parseInt(PORT) + 1}`,
      );
    });
  } else {
    console.error("Server error:", err);
    process.exit(1);
  }
});

module.exports = app;
