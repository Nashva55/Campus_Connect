const { conversations } = require("../data/mockData");

function getConversations(request, response) {
  response.json({
    conversations
  });
}

function getConversationById(request, response) {
  const conversation = conversations.find((item) => item.id === request.params.id);

  if (!conversation) {
    return response.status(404).json({ message: "Conversation not found." });
  }

  response.json({ conversation });
}

function sendMessage(request, response) {
  const { text } = request.body;
  const conversation = conversations.find((item) => item.id === request.params.id);

  if (!conversation) {
    return response.status(404).json({ message: "Conversation not found." });
  }

  if (!text || !text.trim()) {
    return response.status(400).json({ message: "Message text is required." });
  }

  const message = {
    id: `msg-${Date.now()}`,
    sender: request.user.name,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  conversation.messages.push(message);

  response.status(201).json({
    message: "Message sent successfully.",
    conversation
  });
}

module.exports = {
  getConversations,
  getConversationById,
  sendMessage
};
