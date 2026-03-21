const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/:id/profile", verifyToken, async (request, response) => {
  try {
    const user = await User.findById(request.params.id);

    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });

    response.json({
      user: user.toSafeObject(),
      posts: posts.map((post) => post.toClientObject(request.user._id))
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load user profile.", error: error.message });
  }
});

module.exports = router;
