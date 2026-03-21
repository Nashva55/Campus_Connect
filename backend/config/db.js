const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri || !mongoUri.startsWith("mongodb")) {
      throw new Error(
        "MONGO_URI is missing or invalid. Use either mongodb://127.0.0.1:27017/campusconnect for local MongoDB or your MongoDB Atlas connection string in backend/.env."
      );
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("connect ECONNREFUSED") ||
      error.message.includes("Server selection timed out")
    ) {
      console.error(
        "Database connection failed: MongoDB server is not running or not reachable. Start local MongoDB on 127.0.0.1:27017 or replace MONGO_URI in backend/.env with a working MongoDB Atlas connection string."
      );
    } else {
      console.error("Database connection failed:", error.message);
    }

    throw error;
  }
}

module.exports = connectDB;
