const express = require("express");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

function normalizeConversation(conversation, currentUserId) {
  return conversation.toClientObject(currentUserId);
}

async function findConversationForUser(conversationId, userId) {
  return Conversation.findOne({
    _id: conversationId,
    members: userId
  }).populate("members", "name email role");
}

function emitConversationUpdate(request, conversation, memberIds) {
  const io = request.app.get("io");

  if (!io) {
    return;
  }

  memberIds.forEach((memberId) => {
    io.to(`user:${memberId}`).emit("conversation:updated", {
      conversation: normalizeConversation(conversation, memberId)
    });
  });
}

router.get("/conversations", verifyToken, async (request, response) => {
  try {
    const conversations = await Conversation.find({ members: request.user._id })
      .populate("members", "name email role")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    response.json({
      conversations: conversations.map((conversation) => normalizeConversation(conversation, request.user._id))
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load conversations.", error: error.message });
  }
});

router.post("/conversations/direct", verifyToken, async (request, response) => {
  try {
    const { targetUserId } = request.body;

    if (!targetUserId) {
      return response.status(400).json({ message: "Target user is required." });
    }

    if (String(targetUserId) === String(request.user._id)) {
      return response.status(400).json({ message: "You cannot start a direct chat with yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return response.status(404).json({ message: "Target user not found." });
    }

    let conversation = await Conversation.findOne({
      type: "direct",
      members: { $all: [request.user._id, targetUserId], $size: 2 }
    }).populate("members", "name email role");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        members: [request.user._id, targetUserId],
        createdBy: request.user._id,
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findById(conversation._id).populate("members", "name email role");
    }

    emitConversationUpdate(request, conversation, conversation.members.map((member) => String(member._id)));

    response.status(201).json({
      message: "Direct conversation ready.",
      conversation: normalizeConversation(conversation, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to create direct conversation.", error: error.message });
  }
});

router.post("/conversations/group", verifyToken, async (request, response) => {
  try {
    const { name, memberIds = [] } = request.body;

    const trimmedName = String(name || "").trim();
    if (trimmedName.length < 3) {
      return response.status(400).json({ message: "Group name must be at least 3 characters." });
    }

    const uniqueMemberIds = [...new Set(memberIds.map((id) => String(id)).filter(Boolean))]
      .filter((id) => id !== String(request.user._id));

    if (uniqueMemberIds.length < 1) {
      return response.status(400).json({ message: "Add at least one member to create a group." });
    }

    const validMembers = await User.find({ _id: { $in: uniqueMemberIds } });
    if (validMembers.length !== uniqueMemberIds.length) {
      return response.status(400).json({ message: "One or more selected members are invalid." });
    }

    let conversation = await Conversation.create({
      type: "group",
      name: trimmedName,
      members: [request.user._id, ...uniqueMemberIds],
      createdBy: request.user._id,
      lastMessageAt: new Date()
    });

    conversation = await Conversation.findById(conversation._id).populate("members", "name email role");
    emitConversationUpdate(request, conversation, conversation.members.map((member) => String(member._id)));

    response.status(201).json({
      message: "Group chat created successfully.",
      conversation: normalizeConversation(conversation, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to create group chat.", error: error.message });
  }
});

router.get("/conversations/:id/messages", verifyToken, async (request, response) => {
  try {
    const conversation = await findConversationForUser(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: "Conversation not found." });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    response.json({
      conversation: normalizeConversation(conversation, request.user._id),
      messages: messages.map((message) => message.toClientObject(request.user._id))
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load messages.", error: error.message });
  }
});

router.post("/conversations/:id/messages", verifyToken, async (request, response) => {
  try {
    const conversation = await findConversationForUser(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: "Conversation not found." });
    }

    const text = String(request.body.text || "").trim();
    if (!text) {
      return response.status(400).json({ message: "Message text is required." });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: request.user._id,
      senderName: request.user.name,
      text
    });

    conversation.lastMessageText = text;
    conversation.lastMessageSenderName = request.user.name;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const io = request.app.get("io");
    const memberIds = conversation.members.map((member) => String(member._id));

    emitConversationUpdate(request, conversation, memberIds);

    if (io) {
      io.to(`conversation:${conversation._id}`).emit("message:new", {
        chatMessage: message.toClientObject(request.user._id),
        conversationId: String(conversation._id)
      });
    }

    response.status(201).json({
      message: "Message sent successfully.",
      chatMessage: message.toClientObject(request.user._id),
      conversation: normalizeConversation(conversation, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to send message.", error: error.message });
  }
});

module.exports = router;

