require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db.config");
const errorHandler = require("./middleware/error.middleware");
const { startAutomation } = require("./services/automation.service");
const { startControlUnit } = require("./services/controlUnit.service");

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

    const existing = await User.findOne({ email: adminEmail });
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

// Connect to database
connectDB().then(async () => {
  // Seed fixed admin account
  await seedAdmin();
  // Start automation engine after DB is connected
  startAutomation();
  // Start control unit dispatcher
  await startControlUnit();
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "RailMadad API - AI-Integrated Railway Complaint Management System",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
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
