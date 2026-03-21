const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getConversations,
  getConversationById,
  sendMessage
} = require("../controllers/messageController");

const router = express.Router();

router.get("/", protect, getConversations);
router.get("/:id", protect, getConversationById);
router.post("/:id", protect, sendMessage);

module.exports = router;
