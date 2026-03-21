const express = require("express");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/create-user", verifyToken, isAdmin, async (request, response) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!isValidEmail(email)) {
      return response.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.trim().length < 6) {
      return response.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return response.status(409).json({ message: "A user with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: "student"
    });

    response.status(201).json({
      message: "Student account created successfully.",
      user: user.toSafeObject()
    });
  } catch (error) {
    response.status(500).json({
      message: "Unable to create user right now.",
      error: error.message
    });
  }
});

module.exports = router;
