import { Router } from "express";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  updatePost,
} from "../controllers/post.controller.js";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../utils/asyncHandler.js";
import commentRoutes from "./comment.routes.js";

const router = Router();

// Mount comment routes for a specific post
router.use("/:postId/comments", commentRoutes);


/**
 * @route   GET /posts
 * @desc    Get all posts
 * @access  Public
 */

router.get(
  "/", 
  asyncHandler(getPosts)
);

/**
 * @route   POST /posts
 * @desc    Create a new post
 * @access  Private
 * @body    { title, content }
 */

router.post(
  "/", 
  authenticate, 
  asyncHandler(createPost)
);


/**
 * @route   GET /posts/:id
 * @desc    Get a post by ID
 * @access  Public
 */

router.get(
  "/:id", 
  asyncHandler(getPostById)
);

/**
 * @route   PUT /posts/:id
 * @desc    Update a post by ID
 * @access  Private
 * @body    { title, content }
 */

router.put(
  "/:id", 
  authenticate, 
  asyncHandler(updatePost)
);


/**
 * @route   DELETE /posts/:id
 * @desc    Delete a post by ID
 * @access  Private
 */

router.delete(
  "/:id", 
  authenticate, 
  asyncHandler(deletePost)
);

export default router;
