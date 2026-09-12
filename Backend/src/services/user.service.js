import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import paginationMeta from "../utils/pagination.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  bio: user.bio,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

export const updateCurrentUser = async (userId, payload = {}) => {
  const user = await User.findById(userId);

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  const updates = {};

  if (payload.username !== undefined) {
    updates.username = String(payload.username).trim();
  }

  if (payload.bio !== undefined) {
    updates.bio = String(payload.bio).trim();
  }

  if (payload.avatar !== undefined) {
    updates.avatar = String(payload.avatar).trim();
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "At least one field is required to update the profile");
  }

  if (updates.username) {
    const existingUser = await User.findOne({
      username: updates.username,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(409, "Username already taken");
    }
  }

  Object.assign(user, updates);
  await user.save();

  return sanitizeUser(user);
};

export const getUserPosts = async (userId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 10, 50);

  const [posts, totalItems] = await Promise.all([
    Post.find({ author: userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "username avatar")
      .lean(),
    Post.countDocuments({ author: userId, deletedAt: null }),
  ]);

  return {
    posts,
    pagination: paginationMeta(totalItems, page, limit),
  };
};

export const getAllUsers = async (query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 10, 50);

  const [users, totalItems] = await Promise.all([
    User.find({ deletedAt: null })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments({ deletedAt: null }),
  ]);

  return {
    users,
    pagination: paginationMeta(totalItems, page, limit),
  };
};

export const deleteUserByAdmin = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  user.deletedAt = new Date();
  await user.save();

  return true;
};

export default {
  getCurrentUser,
  updateCurrentUser,
  getUserPosts,
  getAllUsers,
  deleteUserByAdmin,
};
