const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";

const authRoutes = require("../routes/auth.routes");

function createTestApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

test("POST /api/auth/register rejects passwords less than 8 characters", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "user@example.com",
    password: "Pass1!",
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 8 characters/i);
});

test("POST /api/auth/register rejects passwords without uppercase letter", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "user@example.com",
    password: "password1!",
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /uppercase letter/i);
});

test("POST /api/auth/register rejects passwords without number", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "user@example.com",
    password: "Password!",
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /number/i);
});

test("POST /api/auth/register rejects passwords without special character", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "user@example.com",
    password: "Password1",
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /special character/i);
});

test("POST /api/auth/register accepts valid strong password", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "strongpass@example.com",
    password: "StrongP@ss123",
  });

  // Strong password passes validation — response should not contain password strength errors
  const msg = res.body.message || "";
  assert.equal(msg.includes("uppercase"), false);
  assert.equal(msg.includes("number"), false);
  assert.equal(msg.includes("special character"), false);
  assert.equal(msg.includes("8 characters"), false);
});

test("POST /api/auth/admin-register enforces same password strength rules", async () => {
  const app = createTestApp();

  const res = await request(app).post("/api/auth/admin-register").send({
    name: "Admin User",
    email: "admin@example.com",
    password: "weak",
    adminKey: "test-key",
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 8 characters/i);
});

test("PUT /api/auth/reset-password/:token enforces password strength", async () => {
  const app = createTestApp();

  const res = await request(app)
    .put("/api/auth/reset-password/testtoken")
    .send({ password: "short!" });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 8 characters|uppercase|number/i);
});
