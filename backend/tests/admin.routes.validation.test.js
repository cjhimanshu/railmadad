const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

const adminRoutes = require("../routes/admin.routes");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const ControlUnitDispatch = require("../models/ControlUnitDispatch");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/admin", adminRoutes);
  return app;
}

function adminAuthHeader() {
  const token = jwt.sign(
    { id: "507f1f77bcf86cd799439011" },
    process.env.JWT_SECRET,
  );
  return `Bearer ${token}`;
}

const originalUserFindById = User.findById;
const originalComplaintFind = Complaint.find;
const originalComplaintFindById = Complaint.findById;
const originalDispatchFindOneAndUpdate = ControlUnitDispatch.findOneAndUpdate;

function restoreModelMethods() {
  User.findById = originalUserFindById;
  Complaint.find = originalComplaintFind;
  Complaint.findById = originalComplaintFindById;
  ControlUnitDispatch.findOneAndUpdate = originalDispatchFindOneAndUpdate;
}

test.beforeEach(() => {
  User.findById = () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      role: "admin",
      isActive: true,
    }),
  });
});

test.afterEach(() => {
  restoreModelMethods();
});

test("GET /api/admin/complaints validates pagination query", async () => {
  const app = createTestApp();
  let didQueryComplaints = false;

  Complaint.find = () => {
    didQueryComplaints = true;
    return {};
  };

  const res = await request(app)
    .get("/api/admin/complaints?page=0")
    .set("Authorization", adminAuthHeader());

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /page must be a positive integer/i);
  assert.equal(didQueryComplaints, false);
});

test("PUT /api/admin/complaints/:id/status validates complaint id", async () => {
  const app = createTestApp();
  let didLookupComplaint = false;

  Complaint.findById = async () => {
    didLookupComplaint = true;
    return null;
  };

  const res = await request(app)
    .put("/api/admin/complaints/not-a-mongo-id/status")
    .set("Authorization", adminAuthHeader())
    .send({ status: "in_progress" });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /complaint id must be valid/i);
  assert.equal(didLookupComplaint, false);
});

test("PUT /api/admin/dispatch-log/:batchId/acknowledge validates batch id", async () => {
  const app = createTestApp();
  let didUpdateDispatch = false;

  ControlUnitDispatch.findOneAndUpdate = async () => {
    didUpdateDispatch = true;
    return null;
  };

  const res = await request(app)
    .put("/api/admin/dispatch-log/bad-batch/acknowledge")
    .set("Authorization", adminAuthHeader());

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /dispatch batch id must be valid/i);
  assert.equal(didUpdateDispatch, false);
});
