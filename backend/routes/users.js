const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

async function mapUsers(list, currentUser) {
  const followingSet = new Set(currentUser.following.map((id) => id.toString()));

  return list.map((user) => ({
    ...user.toSafeObject(),
    isFollowing: followingSet.has(String(user._id))
  }));
}

router.get("/me/network", verifyToken, async (request, response) => {
  try {
    const currentUser = await User.findById(request.user._id);

    if (!currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    response.json({
      userId: String(currentUser._id),
      followingIds: currentUser.following.map((id) => String(id)),
      followerIds: currentUser.followers.map((id) => String(id)),
      followingCount: currentUser.following.length,
      followersCount: currentUser.followers.length
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load network info.", error: error.message });
  }
});

router.get("/directory", verifyToken, async (request, response) => {
  try {
    const currentUser = await User.findById(request.user._id);

    if (!currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    const followingSet = new Set(currentUser.following.map((id) => id.toString()));

    const users = await User.find({
      _id: { $ne: request.user._id },
      role: "student"
    }).sort({ name: 1 });

    response.json({
      users: users.map((user) => ({
        ...user.toSafeObject(),
        isFollowing: followingSet.has(String(user._id))
      }))
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

router.get("/:id/connections", verifyToken, async (request, response) => {
  try {
    const type = String(request.query.type || "").trim().toLowerCase();

    if (!["followers", "following"].includes(type)) {
      return response.status(400).json({ message: "Connection type must be followers or following." });
    }

    const targetUser = await User.findById(request.params.id);
    const currentUser = await User.findById(request.user._id);

    if (!targetUser || !currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    const connectionIds = type === "followers" ? targetUser.followers : targetUser.following;
    const users = await User.find({ _id: { $in: connectionIds }, role: "student" }).sort({ name: 1 });

    response.json({
      title: type === "followers" ? "Followers" : "Following",
      users: await mapUsers(users, currentUser)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load connections.", error: error.message });
  }
});

router.post("/:id/follow", verifyToken, async (request, response) => {
  try {
    if (request.user._id.toString() === request.params.id) {
      return response.status(400).json({ message: "You cannot follow yourself." });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(request.params.id),
      User.findById(request.user._id)
    ]);

    if (!targetUser || !currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    if (targetUser.role !== "student") {
      return response.status(400).json({ message: "Only student profiles can be followed." });
    }

    const alreadyFollowing = currentUser.following.some((id) => id.toString() === targetUser._id.toString());

    if (alreadyFollowing) {
      await Promise.all([
        User.updateOne({ _id: currentUser._id }, { $pull: { following: targetUser._id } }),
        User.updateOne({ _id: targetUser._id }, { $pull: { followers: currentUser._id } })
      ]);
    } else {
      await Promise.all([
        User.updateOne({ _id: currentUser._id }, { $addToSet: { following: targetUser._id } }),
        User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: currentUser._id } })
      ]);
    }

    const [updatedCurrentUser, updatedTargetUser] = await Promise.all([
      User.findById(currentUser._id),
      User.findById(targetUser._id)
    ]);

    const isFollowing = updatedCurrentUser.following.some((id) => id.toString() === updatedTargetUser._id.toString());

    response.json({
      message: isFollowing ? "User followed successfully." : "User unfollowed successfully.",
      user: {
        ...updatedTargetUser.toSafeObject(),
        isFollowing
      },
      currentUser: updatedCurrentUser.toSafeObject(),
      network: {
        followingIds: updatedCurrentUser.following.map((id) => String(id)),
        followerIds: updatedCurrentUser.followers.map((id) => String(id)),
        followingCount: updatedCurrentUser.following.length,
        followersCount: updatedCurrentUser.followers.length
      }
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to update follow status.", error: error.message });
  }
});

module.exports = router;
