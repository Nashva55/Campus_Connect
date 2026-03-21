const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

messageSchema.methods.toClientObject = function toClientObject(currentUserId) {
  return {
    id: this._id,
    conversationId: this.conversationId,
    senderId: this.senderId,
    senderName: this.senderName,
    text: this.text,
    createdAt: this.createdAt,
    isOwn: String(this.senderId) === String(currentUserId)
  };
};

module.exports = mongoose.model("Message", messageSchema);
