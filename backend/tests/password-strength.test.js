const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";

const authRoutes = require("../routes/auth.routes");
const User = require("../models/User");

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
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  User.findOne = async () => null;
  User.create = async (payload) => ({
    _id: "507f1f77bcf86cd799439099",
    name: payload.name,
    email: payload.email,
    role: "user",
    phone: payload.phone,
    isOtpUser: false,
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        phone: this.phone,
        isOtpUser: this.isOtpUser,
      };
    },
  });

  try {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "strongpass@example.com",
      password: "StrongP@ss123",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, "strongpass@example.com");
    assert.equal(typeof res.body.data.token, "string");
    assert.ok(res.body.data.token.length > 10);
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
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
