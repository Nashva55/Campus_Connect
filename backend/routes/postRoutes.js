const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getPosts, createPost, deletePost, toggleLike, addComment } = require("../controllers/postController");

const router = express.Router();

router.get("/", protect, getPosts);
router.post("/", protect, createPost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/comments", protect, addComment);

module.exports = router;
