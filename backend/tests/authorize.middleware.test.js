const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");

const { authorize } = require("../middleware/auth.middleware");

function createAppWithAuthorize(role) {
  const app = express();

  if (role !== undefined) {
    // inject a fake user for tests that need one
    app.use((req, res, next) => {
      req.user = { role };
      next();
    });
  }

  app.use("/admin", authorize("admin"), (req, res) => {
    res.json({ success: true });
  });

  return app;
}

test("authorize responds 401 when req.user is missing", async () => {
  const app = createAppWithAuthorize();

  const res = await request(app).get("/admin");

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not authorized/i);
});

test("authorize responds 403 when role not allowed", async () => {
  const app = createAppWithAuthorize("user");

  const res = await request(app).get("/admin");

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /not authorized to access this route/i);
});
