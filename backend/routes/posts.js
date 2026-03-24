const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { getPosts, createPost, deletePost, toggleLike, addComment, sharePost } = require("../controllers/postController");

const router = express.Router();

router.get("/", verifyToken, getPosts);
router.post("/", verifyToken, createPost);
router.delete("/:id", verifyToken, deletePost);
router.post("/:id/like", verifyToken, toggleLike);
router.post("/:id/comments", verifyToken, addComment);
router.post("/:id/share", verifyToken, sharePost);

module.exports = router;
