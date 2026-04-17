const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_key";

const authController = require("../controllers/auth.controller");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const OtpModel = require("../models/Otp");

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

const originalUserFindOne = User.findOne;
const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
const originalOtpFindOne = OtpModel.findOne;
const originalOtpDeleteMany = OtpModel.deleteMany;
const originalComplaintFindOne = Complaint.findOne;

function restoreModelMethods() {
  User.findOne = originalUserFindOne;
  User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
  OtpModel.findOne = originalOtpFindOne;
  OtpModel.deleteMany = originalOtpDeleteMany;
  Complaint.findOne = originalComplaintFindOne;
}

test.afterEach(() => {
  restoreModelMethods();
});

test("login succeeds for valid user email/password", async () => {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = {
    _id: "507f1f77bcf86cd799439011",
    name: "Test User",
    email: "user@example.com",
    password: hashedPassword,
    role: "user",
    isActive: true,
    isOtpUser: false,
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isOtpUser: this.isOtpUser,
      };
    },
  };

  User.findOne = () => ({
    select: async () => user,
  });

  const req = {
    body: {
      email: "user@example.com",
      password: "password123",
    },
  };
  const res = createMockRes();

  await authController.login(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.email, "user@example.com");
  assert.equal(typeof res.body.data.token, "string");
  assert.ok(res.body.data.token.length > 10);
});

test("adminLogin succeeds for configured admin account", async () => {
  const hashedPassword = await bcrypt.hash("adminPass123", 10);
  const adminUser = {
    _id: "507f1f77bcf86cd799439012",
    name: "Railway Admin",
    email: process.env.ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
    isActive: true,
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
      };
    },
  };

  User.findOne = () => ({
    select: async () => adminUser,
  });

  let updatedId = null;
  User.findByIdAndUpdate = async (id) => {
    updatedId = id;
  };

  const req = {
    body: {
      email: process.env.ADMIN_EMAIL,
      password: "adminPass123",
    },
  };
  const res = createMockRes();

  await authController.adminLogin(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, "Admin login successful");
  assert.equal(updatedId, adminUser._id);
  assert.equal(typeof res.body.data.token, "string");
});

test("forgotPassword returns generic success for unknown email", async () => {
  User.findOne = async () => null;

  const req = {
    body: {
      email: "missing@example.com",
    },
  };
  const res = createMockRes();

  await authController.forgotPassword(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.message, /if an account with that email exists/i);
});

test("verifyOtp succeeds for active existing user", async () => {
  const otpHash = await bcrypt.hash("123456", 10);
  OtpModel.findOne = async () => ({
    identifier: "user@example.com",
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  let deletedIdentifier = null;
  OtpModel.deleteMany = async (query) => {
    deletedIdentifier = query.identifier;
  };

  User.findOne = async () => ({
    _id: "507f1f77bcf86cd799439013",
    name: "OTP User",
    email: "user@example.com",
    role: "user",
    isActive: true,
    isOtpUser: true,
    toObject() {
      return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isOtpUser: this.isOtpUser,
      };
    },
  });

  const req = {
    body: {
      email: "user@example.com",
      otp: "123456",
    },
  };
  const res = createMockRes();

  await authController.verifyOtp(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(deletedIdentifier, "user@example.com");
  assert.equal(res.body.data.user.email, "user@example.com");
  assert.equal(typeof res.body.data.token, "string");
});
