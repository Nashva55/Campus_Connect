const Post = require("../models/Post");
const User = require("../models/User");

async function buildPhotoMap(posts) {
  const ids = new Set();

  posts.forEach((post) => {
    ids.add(String(post.userId));
    post.comments.forEach((comment) => ids.add(String(comment.userId)));
  });

  const users = await User.find({ _id: { $in: [...ids] } }, "profilePhoto");
  return users.reduce((map, user) => {
    map[String(user._id)] = user.profilePhoto || "";
    return map;
  }, {});
}

async function serializePosts(posts, currentUserId) {
  const photoMap = await buildPhotoMap(posts);

  return posts.map((post) => post.toClientObject(currentUserId, {
    authorPhoto: photoMap[String(post.userId)] || "",
    commentAuthorPhotos: photoMap
  }));
}

async function serializePost(post, currentUserId) {
  const [serialized] = await serializePosts([post], currentUserId);
  return serialized;
}

async function getPosts(request, response) {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    response.json({
      posts: await serializePosts(posts, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to fetch posts.", error: error.message });
  }
}

async function createPost(request, response) {
  try {
    const { caption = "", mediaURL = "", mediaType = "" } = request.body;

    if (!caption.trim() && !mediaURL.trim()) {
      return response.status(400).json({ message: "Add a caption or media before posting." });
    }

    const post = await Post.create({
      userId: request.user._id,
      authorName: request.user.name,
      authorEmail: request.user.email,
      caption: caption.trim(),
      mediaURL: mediaURL.trim(),
      mediaType: mediaType || ""
    });

    response.status(201).json({
      message: "Post created successfully.",
      post: await serializePost(post, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to create post.", error: error.message });
  }
}

async function deletePost(request, response) {
  try {
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ message: "Post not found." });
    }

    if (post.userId.toString() !== request.user._id.toString()) {
      return response.status(403).json({ message: "You can delete only your own posts." });
    }

    await post.deleteOne();

    response.json({ message: "Post deleted successfully." });
  } catch (error) {
    response.status(500).json({ message: "Unable to delete post.", error: error.message });
  }
}

async function toggleLike(request, response) {
  try {
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ message: "Post not found." });
    }

    const existingIndex = post.likes.findIndex((item) => item.toString() === request.user._id.toString());

    if (existingIndex >= 0) {
      post.likes.splice(existingIndex, 1);
    } else {
      post.likes.push(request.user._id);
    }

    await post.save();

    response.json({
      message: "Post like updated.",
      post: await serializePost(post, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to update like.", error: error.message });
  }
}

async function addComment(request, response) {
  try {
    const { text } = request.body;

    if (!text || !text.trim()) {
      return response.status(400).json({ message: "Comment text is required." });
    }

    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ message: "Post not found." });
    }

    post.comments.push({
      userId: request.user._id,
      authorName: request.user.name,
      text: text.trim()
    });

    await post.save();

    response.status(201).json({
      message: "Comment added successfully.",
      post: await serializePost(post, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to add comment.", error: error.message });
  }
}

async function sharePost(request, response) {
  try {
    const post = await Post.findById(request.params.id);

    if (!post) {
      return response.status(404).json({ message: "Post not found." });
    }

    post.shareCount += 1;
    await post.save();

    response.json({
      message: "Post shared successfully.",
      post: await serializePost(post, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to share post.", error: error.message });
  }
}

module.exports = {
  getPosts,
  createPost,
  deletePost,
  toggleLike,
  addComment,
  sharePost
};
