import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import ApiError from "../utils/ApiError.js";
import paginationMeta from "../utils/pagination.js";

const parsePage = (value) => {
  const page = Number(value);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
};

const parseLimit = (value) => {
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit < 1) return 20;
  return Math.min(limit, 50);
};

export const getComments = async (postId, query = {}) => {
  const post = await Post.findById(postId);

  if (!post || post.deletedAt) {
    throw new ApiError(404, "Post not found");
  }

  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);

  const [comments, totalItems] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .lean(),
    Comment.countDocuments({ post: postId }),
  ]);

  return {
    comments,
    pagination: paginationMeta(totalItems, page, limit),
  };
};

export const addComment = async (postId, authorId, payload = {}) => {
  const post = await Post.findById(postId);

  if (!post || post.deletedAt) {
    throw new ApiError(404, "Post not found");
  }

  const body = payload.body?.trim();

  if (!body) {
    throw new ApiError(400, "Comment body is required");
  }

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    body,
  });

  await comment.populate("author", "username avatar");
  return comment;
};

export const deleteComment = async (commentId, userId, role, postId) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (!comment.author.equals(userId) && role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  if (postId && !comment.post.equals(postId)) {
    throw new ApiError(404, "Comment not found");
  }

  await comment.deleteOne();
  return true;
};

export default {
  getComments,
  addComment,
  deleteComment,
};
