import { Router } from "express";
import {
  addComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router({ mergeParams: true });

/**
 * @route   GET /comments
 * @desc    Get all comments for a specific post
 * @access  Public
 */

router.get(
  "/",
  asyncHandler(getComments)
);

/**
 * @route   POST /comments
 * @desc    Add a new comment to a specific post
 * @access  Private
 * @body    { content }
 */

router.post(
  "/",
  authenticate, asyncHandler(addComment)
);


/**
 * @route   DELETE /comments/:commentId
 * @desc    Delete a comment by ID
 * @access  Private
 */

router.delete(
  "/:commentId",
  authenticate,
  asyncHandler(deleteComment)
);

export default router;
