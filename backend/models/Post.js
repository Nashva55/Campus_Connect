const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    authorName: {
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

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    authorName: {
      type: String,
      required: true,
      trim: true
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    caption: {
      type: String,
      trim: true,
      default: ""
    },
    mediaURL: {
      type: String,
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["", "image", "video"],
      default: ""
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: []
    },
    comments: {
      type: [commentSchema],
      default: []
    },
    shareCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

postSchema.methods.toClientObject = function toClientObject(currentUserId, extras = {}) {
  const commentAuthorPhotos = extras.commentAuthorPhotos || {};

  return {
    id: this._id,
    userId: this.userId,
    authorName: this.authorName,
    authorEmail: this.authorEmail,
    authorPhoto: extras.authorPhoto || "",
    caption: this.caption,
    mediaURL: this.mediaURL,
    mediaType: this.mediaType,
    likes: this.likes.length,
    liked: currentUserId ? this.likes.some((item) => item.toString() === currentUserId.toString()) : false,
    comments: this.comments.map((comment) => ({
      id: comment._id,
      userId: comment.userId,
      authorName: comment.authorName,
      authorPhoto: commentAuthorPhotos[String(comment.userId)] || "",
      text: comment.text,
      createdAt: comment.createdAt
    })),
    shareCount: this.shareCount,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("Post", postSchema);
