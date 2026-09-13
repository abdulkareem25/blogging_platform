import { Router } from "express";
import {
  deleteUserByAdmin,
  getAllUsers,
} from "../controllers/admin.controller.js";
import authenticate from "../middleware/authenticate.js";
import requireRole from "../middleware/requireRole.js";
import { validateQuery } from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";
import { paginatedQuerySchema } from "../validators/query.validator.js";

const router = Router();

/**
 * @route   GET /admin/users
 * @desc    Get all users (admin only)
 * @access  Private 
 */

router.get(
  "/users",
  authenticate,
  requireRole(["admin"]),
  validateQuery(paginatedQuerySchema),
  asyncHandler(getAllUsers)
);

/**
 * @route   DELETE /admin/users/:id
 * @desc    Delete a user by ID (admin only)
 * @access  Private 
 */

router.delete(
  "/users/:id",
  authenticate,
  requireRole(["admin"]),
  asyncHandler(deleteUserByAdmin)
);

export default router;
