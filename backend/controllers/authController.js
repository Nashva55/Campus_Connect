const User = require("../models/User");
const generateToken = require("../utils/generateToken");

async function registerUser(request, response) {
  try {
    const { name, username, email, password, college, year } = request.body;

    if (!name || !username || !email || !password) {
      return response.status(400).json({ message: "Name, username, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (existingUser) {
      return response.status(409).json({ message: "Email or username already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      college: college?.trim() || undefined,
      year: year?.trim() || undefined
    });

    response.status(201).json({
      message: "Registration successful.",
      token: generateToken(user._id),
      user: user.toSafeObject()
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to register user.", error: error.message });
  }
}

async function loginUser(request, response) {
  try {
    const { username, email, password } = request.body;

    if ((!username && !email) || !password) {
      return response.status(400).json({ message: "Username or email, and password are required." });
    }

    const query = email
      ? { email: email.trim().toLowerCase() }
      : { username: username.trim().toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      return response.status(401).json({ message: "Account not found." });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return response.status(401).json({ message: "Invalid password." });
    }

    response.json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: user.toSafeObject()
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to log in.", error: error.message });
  }
}

function getCurrentUser(request, response) {
  response.json({
    user: request.user.toSafeObject()
  });
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};
