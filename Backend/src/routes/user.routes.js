import { Router } from "express";
import {
  getCurrentUser,
  getUserPosts,
  updateCurrentUser,
} from "../controllers/user.controller.js";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

/**
 * @route   GET /users/me
 * @desc    Get the current authenticated user's profile
 * @access  Private
 */

router.get(
  "/me", 
  authenticate, 
  asyncHandler(getCurrentUser)
);

/**
 * @route   PUT /users/me
 * @desc    Update the current authenticated user's profile
 * @access  Private
 * @body    { username, email, password }
 */

router.put(
  "/me", 
  authenticate, 
  asyncHandler(updateCurrentUser)
);

/**
 * @route   GET /users/:id/posts
 * @desc    Get all posts by a specific user
 * @access  Public
 */

router.get(
  "/:id/posts", 
  asyncHandler(getUserPosts)
);

export default router;