import { Router } from "express";
import Joi from "joi";
import {
  getCurrentUser,
  getUserPosts,
  updateCurrentUser,
} from "../controllers/user.controller.js";
import authenticate from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { paginatedQuerySchema } from "../validators/query.validator.js";

const profileSchema = Joi.object({
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30),
  bio: Joi.string().trim().max(300),
  avatar: Joi.string().trim().uri().allow(""),
}).min(1);

const router = Router();

/**
 * @route   GET /users/me
 * @desc    Get the current authenticated user's profile
 * @access  Private
 */

router.get(
  "/me",
  authenticate,
  validateBody(profileSchema),
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
  validateQuery(paginatedQuerySchema),
  asyncHandler(getUserPosts)
);

export default router;