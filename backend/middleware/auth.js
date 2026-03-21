const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function verifyToken(request, response, next) {
  try {
    const authorizationHeader = request.headers.authorization || "";

    if (!authorizationHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Access denied. Token missing." });
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return response.status(401).json({ message: "Invalid token. User not found." });
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({ message: "Invalid or expired token." });
  }
}

function isAdmin(request, response, next) {
  if (!request.user || request.user.role !== "admin") {
    return response.status(403).json({ message: "Access denied. Admin only." });
  }

  next();
}

module.exports = {
  verifyToken,
  isAdmin
};
