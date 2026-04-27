const test = require("node:test");
const assert = require("node:assert/strict");

const complaintController = require("../controllers/complaint.controller");
const Complaint = require("../models/Complaint");

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const originalFindById = Complaint.findById;
const originalFindByIdAndUpdate = Complaint.findByIdAndUpdate;

function restoreModelMethods() {
  Complaint.findById = originalFindById;
  Complaint.findByIdAndUpdate = originalFindByIdAndUpdate;
}

test.afterEach(() => {
  restoreModelMethods();
});

test("getComplaint allows access for contact-email matched user when userId is missing", async () => {
  const complaint = {
    _id: "complaint-1",
    userId: null,
    contactEmail: "traveler@example.com",
    contactMobile: "9876543210",
  };

  Complaint.findById = () => ({
    populate: async () => complaint,
  });

  const req = {
    params: { id: "complaint-1" },
    user: {
      id: "user-1",
      role: "user",
      email: "traveler@example.com",
      phone: "9876543210",
    },
  };
  const res = createMockRes();

  await complaintController.getComplaint(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id, "complaint-1");
});

test("updateComplaint blocks unrelated user from updating complaint", async () => {
  let didCallUpdate = false;

  Complaint.findById = async () => ({
    _id: "complaint-2",
    userId: null,
    contactEmail: "owner@example.com",
    contactMobile: "9999999999",
    status: "pending",
  });

  Complaint.findByIdAndUpdate = async () => {
    didCallUpdate = true;
    return null;
  };

  const req = {
    params: { id: "complaint-2" },
    body: { title: "Updated title", description: "Updated description" },
    user: {
      id: "user-2",
      role: "user",
      email: "other@example.com",
      phone: "8888888888",
    },
  };
  const res = createMockRes();

  await complaintController.updateComplaint(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.success, false);
  assert.equal(didCallUpdate, false);
});

test("updateComplaint allows contact-mobile matched user for pending complaint", async () => {
  const updatedComplaint = {
    _id: "complaint-3",
    userId: null,
    contactEmail: "owner@example.com",
    contactMobile: "7777777777",
    status: "pending",
    title: "New title",
  };

  Complaint.findById = async () => ({
    _id: "complaint-3",
    userId: null,
    contactEmail: "owner@example.com",
    contactMobile: "7777777777",
    status: "pending",
  });

  Complaint.findByIdAndUpdate = () => ({
    populate: async () => updatedComplaint,
  });

  const req = {
    params: { id: "complaint-3" },
    body: { title: "New title", description: "Refined details" },
    user: {
      id: "user-3",
      role: "user",
      email: "different@example.com",
      phone: "7777777777",
    },
  };
  const res = createMockRes();

  await complaintController.updateComplaint(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id, "complaint-3");
});

test("submitSatisfaction rejects malformed rating before reading complaint", async () => {
  let didLookupComplaint = false;

  Complaint.findById = async () => {
    didLookupComplaint = true;
    return null;
  };

  const req = {
    params: { id: "complaint-4" },
    body: { rating: "5abc", comment: "Looks valid at first glance" },
    user: {
      id: "user-4",
      role: "user",
      email: "traveler@example.com",
      phone: "9876543210",
    },
  };
  const res = createMockRes();

  await complaintController.submitSatisfaction(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.match(res.body.message, /rating must be between 1 and 5/i);
  assert.equal(didLookupComplaint, false);
});
