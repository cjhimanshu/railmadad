const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 100, // max simultaneous connections (default was 5)
      minPoolSize: 10, // keep at least 10 connections warm
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} (pool: 10–100)`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
