import mongoose from "mongoose";
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
  if (!Number.isFinite(limit) || limit < 1) return 10;
  return Math.min(limit, 50);
};

export const getPosts = async (query = {}) => {
  const page = parsePage(query.page);
  const limit = parseLimit(query.limit);
  const search = query.search?.trim();
  const tag = query.tag?.trim();
  const sort = query.sort === "oldest" ? "oldest" : "newest";

  const filter = { deletedAt: null };

  if (search) {
    filter.$text = { $search: search };
  }

  if (tag) {
    filter.tags = tag;
  }

  const sortOptions = search
    ? { score: { $meta: "textScore" }, createdAt: sort === "oldest" ? 1 : -1 }
    : { createdAt: sort === "oldest" ? 1 : -1 };

  const [posts, totalItems] = await Promise.all([
    Post.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: paginationMeta(totalItems, page, limit),
  };
};

export const getPostById = async (id) => {
  const filter = { deletedAt: null };

  if (mongoose.Types.ObjectId.isValid(id)) {
    filter._id = id;
  } else {
    filter.slug = id;
  }

  const post = await Post.findOne(filter).populate("author", "username avatar").lean();

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return post;
};

export const createPost = async (authorId, payload = {}) => {
  const title = payload.title?.trim();
  const body = payload.body?.trim();
  const tags = Array.isArray(payload.tags) ? payload.tags.map((tag) => tag.trim()).filter(Boolean) : [];

  if (!title || !body) {
    throw new ApiError(400, "Title and body are required");
  }

  const post = await Post.create({
    title,
    body,
    tags,
    author: authorId,
  });

  await post.populate("author", "username avatar");
  return post;
};

export const updatePost = async (postId, userId, role, payload = {}) => {
  const post = await Post.findById(postId);

  if (!post || post.deletedAt) {
    throw new ApiError(404, "Post not found");
  }

  if (!post.author.equals(userId)) {
    throw new ApiError(403, "Forbidden");
  }

  const updates = {};
  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.body !== undefined) updates.body = payload.body.trim();
  if (payload.tags !== undefined) {
    updates.tags = Array.isArray(payload.tags)
      ? payload.tags.map((tag) => tag.trim()).filter(Boolean)
      : [];
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "At least one field is required to update the post");
  }

  Object.assign(post, updates);
  await post.save();
  await post.populate("author", "username avatar");

  return post;
};

export const deletePost = async (postId, userId, role) => {
  const post = await Post.findById(postId);

  if (!post || post.deletedAt) {
    throw new ApiError(404, "Post not found");
  }

  if (!post.author.equals(userId) && role !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  post.deletedAt = new Date();
  await post.save();

  return true;
};

export default {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
