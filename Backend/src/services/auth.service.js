import jwt from "jsonwebtoken";
import config from "../config/index.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { compareToken, generateTokens } from "../utils/token.js";

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

export const registerUser = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email and password are required");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const user = await User.create({ username, email, password });
  const tokens = generateTokens(user._id, user.role);

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const tokens = generateTokens(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const refreshUserToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, config.refreshTokenSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload._id).select("+refreshToken");

  if (!user || !user.refreshToken || user.deletedAt) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const isValidRefreshToken = await compareToken(refreshToken, user.refreshToken);

  if (!isValidRefreshToken) {
    throw new ApiError(401, "Token reuse detected. Please login again.");
  }

  const tokens = generateTokens(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = null;
  await user.save();

  return true;
};

export default {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
};
