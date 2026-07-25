const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const app = require("../server");

test("GET /health returns an ok status payload", async () => {
  const res = await request(app).get("/health");

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.status, "ok");
  assert.equal(typeof res.body.uptime, "number");
  assert.equal(typeof res.body.timestamp, "string");
});
