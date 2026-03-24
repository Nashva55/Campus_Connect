const express = require("express");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

async function buildConversationPayload(conversation, currentUserId) {
  const readEntry = (conversation.readState || []).find((entry) => String(entry.userId) === String(currentUserId));
  const lastReadAt = readEntry?.lastReadAt || new Date(0);

  const unreadCount = await Message.countDocuments({
    conversationId: conversation._id,
    createdAt: { $gt: lastReadAt },
    senderId: { $ne: currentUserId }
  });

  return conversation.toClientObject(currentUserId, { unreadCount });
}

async function buildConversationPayloads(conversations, currentUserId) {
  return Promise.all(conversations.map((conversation) => buildConversationPayload(conversation, currentUserId)));
}

async function findConversationForUser(conversationId, userId) {
  return Conversation.findOne({
    _id: conversationId,
    members: userId
  }).populate("members", "name email role");
}

function ensureReadState(conversation, userId, timestamp = new Date()) {
  const index = (conversation.readState || []).findIndex((entry) => String(entry.userId) === String(userId));

  if (index >= 0) {
    conversation.readState[index].lastReadAt = timestamp;
    return;
  }

  conversation.readState.push({
    userId,
    lastReadAt: timestamp
  });
}

async function emitConversationUpdate(request, conversation, memberIds) {
  const io = request.app.get("io");

  if (!io) {
    return;
  }

  await Promise.all(memberIds.map(async (memberId) => {
    const payload = await buildConversationPayload(conversation, memberId);
    io.to(`user:${memberId}`).emit("conversation:updated", {
      conversation: payload
    });
  }));
}

router.get("/conversations", verifyToken, async (request, response) => {
  try {
    const conversations = await Conversation.find({ members: request.user._id })
      .populate("members", "name email role")
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    response.json({
      conversations: await buildConversationPayloads(conversations, request.user._id)
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
        lastMessageAt: new Date(),
        readState: [
          { userId: request.user._id, lastReadAt: new Date() },
          { userId: targetUserId, lastReadAt: new Date() }
        ]
      });

      conversation = await Conversation.findById(conversation._id).populate("members", "name email role");
    }

    await emitConversationUpdate(request, conversation, conversation.members.map((member) => String(member._id)));

    response.status(201).json({
      message: "Direct conversation ready.",
      conversation: await buildConversationPayload(conversation, request.user._id)
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

    const allMemberIds = [String(request.user._id), ...uniqueMemberIds];
    let conversation = await Conversation.create({
      type: "group",
      name: trimmedName,
      members: allMemberIds,
      createdBy: request.user._id,
      lastMessageAt: new Date(),
      readState: allMemberIds.map((memberId) => ({
        userId: memberId,
        lastReadAt: new Date()
      }))
    });

    conversation = await Conversation.findById(conversation._id).populate("members", "name email role");
    await emitConversationUpdate(request, conversation, conversation.members.map((member) => String(member._id)));

    response.status(201).json({
      message: "Group chat created successfully.",
      conversation: await buildConversationPayload(conversation, request.user._id)
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
    const lastVisibleMessageTime = messages.length ? messages[messages.length - 1].createdAt : new Date();

    ensureReadState(conversation, request.user._id, lastVisibleMessageTime);
    await conversation.save();
    await emitConversationUpdate(request, conversation, [String(request.user._id)]);

    response.json({
      conversation: await buildConversationPayload(conversation, request.user._id),
      messages: messages.map((message) => message.toClientObject(request.user._id))
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to load messages.", error: error.message });
  }
});

router.post("/conversations/:id/read", verifyToken, async (request, response) => {
  try {
    const conversation = await findConversationForUser(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: "Conversation not found." });
    }

    const lastMessage = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
    ensureReadState(conversation, request.user._id, lastMessage?.createdAt || new Date());
    await conversation.save();
    await emitConversationUpdate(request, conversation, [String(request.user._id)]);

    response.json({
      message: "Conversation marked as read.",
      conversation: await buildConversationPayload(conversation, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to mark conversation as read.", error: error.message });
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
    ensureReadState(conversation, request.user._id, message.createdAt);
    await conversation.save();

    const io = request.app.get("io");
    const memberIds = conversation.members.map((member) => String(member._id));

    await emitConversationUpdate(request, conversation, memberIds);

    if (io) {
      io.to(`conversation:${conversation._id}`).emit("message:new", {
        chatMessage: message.toClientObject(request.user._id),
        conversationId: String(conversation._id)
      });
    }

    response.status(201).json({
      message: "Message sent successfully.",
      chatMessage: message.toClientObject(request.user._id),
      conversation: await buildConversationPayload(conversation, request.user._id)
    });
  } catch (error) {
    response.status(500).json({ message: "Unable to send message.", error: error.message });
  }
});

module.exports = router;
