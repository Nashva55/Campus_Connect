const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(request, response, next) {
  try {
    const authorizationHeader = request.headers.authorization || "";

    if (!authorizationHeader.startsWith("Bearer ")) {
      return response.status(401).json({ message: "Not authorized. Token missing." });
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return response.status(401).json({ message: "User not found for this token." });
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({ message: "Not authorized. Token invalid." });
  }
}

module.exports = {
  protect
};
