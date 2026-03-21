const express = require("express");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return response.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return response.status(401).json({ message: "Invalid password." });
    }

    response.json({
      message: "Login successful",
      token: generateToken(user._id),
      role: user.role,
      user: user.toSafeObject()
    });
  } catch (error) {
    response.status(500).json({
      message: "Unable to login right now.",
      error: error.message
    });
  }
});

module.exports = router;
