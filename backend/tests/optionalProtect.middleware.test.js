const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

const { optionalProtect } = require("../middleware/auth.middleware");
const User = require("../models/User");

function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/whoami", optionalProtect, (req, res) => {
    res.json({ user: req.user || null });
  });
  return app;
}

test("optionalProtect proceeds with null user when no token present", async () => {
  const app = createApp();
  const res = await request(app).get("/whoami");
  assert.equal(res.status, 200);
  assert.equal(res.body.user, null);
});

test("optionalProtect proceeds with null user when token is invalid", async () => {
  const app = createApp();
  const res = await request(app)
    .get("/whoami")
    .set("Authorization", "Bearer bad.token.here");

  assert.equal(res.status, 200);
  assert.equal(res.body.user, null);
});

test("optionalProtect attaches user for valid token", async () => {
  // stub User.findById to return a user object
  const originalFindById = User.findById;
  User.findById = () => ({ select: async () => ({ _id: "507f1f77bcf86cd799439011", role: "user" }) });

  const token = jwt.sign({ id: "507f1f77bcf86cd799439011" }, process.env.JWT_SECRET);
  const app = createApp();

  const res = await request(app).get("/whoami").set("Authorization", `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.user._id, "507f1f77bcf86cd799439011");

  User.findById = originalFindById;
});
