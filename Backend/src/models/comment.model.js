import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ author: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;