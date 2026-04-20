const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const complaintRoutes = require("../routes/complaint.routes");

function createTestApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use("/api/complaints", complaintRoutes);
  return app;
}

test("POST /api/complaints/track rejects invalid tracking ID format", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/complaints/track").send({
    trackingUserId: "bad-id",
    password: "validPass123",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /tracking id/i);
});

test("POST /api/complaints/track enforces minimum password length", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/complaints/track").send({
    trackingUserId: "TRK-1A2B3C4D",
    password: "1234567",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /at least 8 characters/i);
});

test("POST /api/complaints/track applies brute-force rate limit", async () => {
  const app = createTestApp();
  const ip = "203.0.113.10";

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const res = await request(app)
      .post("/api/complaints/track")
      .set("X-Forwarded-For", ip)
      .send({
        trackingUserId: "invalid",
        password: "validPass123",
      });

    assert.equal(res.status, 400);
  }

  const limited = await request(app)
    .post("/api/complaints/track")
    .set("X-Forwarded-For", ip)
    .send({
      trackingUserId: "invalid",
      password: "validPass123",
    });

  assert.equal(limited.status, 429);
  assert.equal(limited.body.success, false);
  assert.match(limited.body.message, /too many complaint tracking attempts/i);
});
