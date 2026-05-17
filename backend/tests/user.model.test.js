const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../models/User");

test("User model JSON transform removes sensitive fields and exposes id", () => {
  const u = new User({
    name: "Alice",
    email: "Alice@Example.COM",
    password: "Secret123!",
    resetPasswordToken: "token",
    resetPasswordExpire: new Date(),
  });

  const json = u.toJSON();

  assert.equal(json.password, undefined);
  assert.equal(json.resetPasswordToken, undefined);
  assert.equal(json.resetPasswordExpire, undefined);
  assert.equal(json.__v, undefined);
  assert.equal(json._id, undefined);
  assert.ok(json.id);
  assert.equal(json.email, "alice@example.com");
});
