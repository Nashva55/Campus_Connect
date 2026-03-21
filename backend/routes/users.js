const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/directory", verifyToken, async (request, response) => {
  try {
    const users = await User.find({
      _id: { $ne: request.user._id },
      role: "student"
    }).sort({ name: 1 });

    response.json({
      users: users.map((user) => user.toSafeObject())
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load users.", error: error.message });
  }
});

router.get("/:id/profile", verifyToken, async (request, response) => {
  try {
    const user = await User.findById(request.params.id);

    if (!user) {
      return response.status(404).json({ message: "User not found." });
    }

    const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });
    const isFollowing = user.followers.some((followerId) => followerId.toString() === request.user._id.toString());

    response.json({
      user: {
        ...user.toSafeObject(),
        isFollowing
      },
      posts: posts.map((post) => post.toClientObject(request.user._id))
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load user profile.", error: error.message });
  }
});

router.post("/:id/follow", verifyToken, async (request, response) => {
  try {
    if (request.user._id.toString() === request.params.id) {
      return response.status(400).json({ message: "You cannot follow yourself." });
    }

    const targetUser = await User.findById(request.params.id);

    if (!targetUser) {
      return response.status(404).json({ message: "User not found." });
    }

    const currentUser = await User.findById(request.user._id);
    const followerIndex = targetUser.followers.findIndex((id) => id.toString() === currentUser._id.toString());
    let isFollowing = false;

    if (followerIndex >= 0) {
      targetUser.followers.splice(followerIndex, 1);
      currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUser._id.toString());
    } else {
      targetUser.followers.push(currentUser._id);
      currentUser.following.push(targetUser._id);
      isFollowing = true;
    }

    await targetUser.save();
    await currentUser.save();

    response.json({
      message: isFollowing ? "User followed successfully." : "User unfollowed successfully.",
      user: {
        ...targetUser.toSafeObject(),
        isFollowing
      },
      currentUser: currentUser.toSafeObject()
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to update follow status.", error: error.message });
  }
});

module.exports = router;
