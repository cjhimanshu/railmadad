const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

// Prevent SDK initialization issues when auth controller is imported by router
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const authRoutes = require("../routes/auth.routes");

function createTestApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

test("POST /api/auth/login rejects invalid identifier", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/login").send({
    email: "not-valid-id",
    password: "password123",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(
    res.body.message,
    /valid email, 10-digit mobile number, or tracking ID/i,
  );
});

test("POST /api/auth/admin-login enforces email validation", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/admin-login").send({
    email: "1234567890",
    password: "password123",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /valid email/i);
});

test("POST /api/auth/send-otp route is wired and validates email", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/send-otp").send({
    email: "bad-email",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /valid email/i);
});

test("POST /api/auth/verify-otp route is wired and validates otp format", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/verify-otp").send({
    email: "user@example.com",
    otp: "12ab56",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /6-digit/i);
});

test("POST /api/auth/forgot-password validates email", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/forgot-password").send({
    email: "invalid",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /valid email/i);
});

test("PUT /api/auth/reset-password/:token validates password length", async () => {
  const app = createTestApp();

  const res = await request(app)
    .put("/api/auth/reset-password/testtoken")
    .send({ password: "123" });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /at least 8 characters/i);
});

test("POST /api/auth/login applies brute-force rate limit", async () => {
  const app = createTestApp();
  const ip = "198.51.100.10";

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", ip)
      .send({
        email: "not-valid-id",
        password: "password123",
      });

    assert.equal(res.status, 400);
  }

  const limited = await request(app)
    .post("/api/auth/login")
    .set("X-Forwarded-For", ip)
    .send({
      email: "not-valid-id",
      password: "password123",
    });

  assert.equal(limited.status, 429);
  assert.equal(limited.body.success, false);
  assert.match(limited.body.message, /too many authentication attempts/i);
});

test("POST /api/auth/send-otp applies request rate limit", async () => {
  const app = createTestApp();
  const ip = "198.51.100.11";

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await request(app)
      .post("/api/auth/send-otp")
      .set("X-Forwarded-For", ip)
      .send({
        email: "bad-email",
      });

    assert.equal(res.status, 400);
  }

  const limited = await request(app)
    .post("/api/auth/send-otp")
    .set("X-Forwarded-For", ip)
    .send({
      email: "bad-email",
    });

  assert.equal(limited.status, 429);
  assert.equal(limited.body.success, false);
  assert.match(limited.body.message, /too many otp requests/i);
});
