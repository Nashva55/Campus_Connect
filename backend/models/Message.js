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
    type: {
      type: String,
      enum: ["text", "resource"],
      default: "text"
    },
    text: {
      type: String,
      trim: true,
      default: ""
    },
    resourceKind: {
      type: String,
      enum: ["link", "file"],
      default: "link"
    },
    resourceTitle: {
      type: String,
      trim: true,
      default: ""
    },
    resourceUrl: {
      type: String,
      trim: true,
      default: ""
    },
    resourceFileName: {
      type: String,
      trim: true,
      default: ""
    },
    resourceFileType: {
      type: String,
      trim: true,
      default: ""
    },
    resourceFileData: {
      type: String,
      default: ""
    },
    resourceFileSize: {
      type: Number,
      default: 0
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
    type: this.type,
    text: this.text,
    resourceKind: this.resourceKind,
    resourceTitle: this.resourceTitle,
    resourceUrl: this.resourceUrl,
    resourceFileName: this.resourceFileName,
    resourceFileType: this.resourceFileType,
    resourceFileData: this.resourceFileData,
    resourceFileSize: this.resourceFileSize,
    createdAt: this.createdAt,
    isOwn: String(this.senderId) === String(currentUserId)
  };
};

module.exports = mongoose.model("Message", messageSchema);
