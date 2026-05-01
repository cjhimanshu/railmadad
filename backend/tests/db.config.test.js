const test = require("node:test");
const assert = require("node:assert/strict");

const connectDB = require("../config/db.config");

test("connectDB exits with a clear error when the MongoDB URI is missing", async () => {
  const originalExit = process.exit;
  const originalError = console.error;
  const originalMongodbUri = process.env.MONGODB_URI;
  const originalMongoUri = process.env.MONGO_URI;

  delete process.env.MONGODB_URI;
  delete process.env.MONGO_URI;

  let exitCode = null;
  let loggedError = "";

  process.exit = (code) => {
    exitCode = code;
    throw new Error("process.exit called");
  };

  console.error = (...args) => {
    loggedError = args.join(" ");
  };

  try {
    await connectDB();
    assert.fail("connectDB should not succeed without a MongoDB URI");
  } catch (error) {
    assert.equal(exitCode, 1);
    assert.match(loggedError, /Missing MongoDB connection string/i);
  } finally {
    process.exit = originalExit;
    console.error = originalError;

    if (originalMongodbUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongodbUri;
    }

    if (originalMongoUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = originalMongoUri;
    }
  }
});
