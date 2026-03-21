const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: ""
    },
    lastMessageSenderName: {
      type: String,
      trim: true,
      default: ""
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.methods.toClientObject = function toClientObject(currentUserId) {
  const memberObjects = (this.members || []).map((member) => ({
    id: member._id || member.id || member,
    name: member.name,
    email: member.email,
    role: member.role
  }));

  const otherMember = this.type === "direct"
    ? memberObjects.find((member) => String(member.id) !== String(currentUserId))
    : null;

  return {
    id: this._id,
    type: this.type,
    name: this.type === "group" ? this.name : (otherMember?.name || "Direct Chat"),
    subtitle: this.type === "group"
      ? `${memberObjects.length} members`
      : (otherMember?.email || "Direct conversation"),
    members: memberObjects,
    lastMessageText: this.lastMessageText,
    lastMessageSenderName: this.lastMessageSenderName,
    lastMessageAt: this.lastMessageAt,
    isGroup: this.type === "group"
  };
};

module.exports = mongoose.model("Conversation", conversationSchema);
