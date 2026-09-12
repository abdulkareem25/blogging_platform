import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password }
 */

router.post(
  "/register",
  asyncHandler(registerUser)
);


/**
 * @route   POST /auth/login
 * @desc    Login a user and return a JWT token
 * @access  Public
 * @body    { email, password }
 */

router.post(
  "/login",
  asyncHandler(loginUser)
);


/**
 * @route   POST /auth/refresh
 * @desc    Refresh the JWT token
 * @access  Public
 * @body    { refreshToken }
 */

router.post(
  "/refresh",
  asyncHandler(refreshUserToken)
);

/**
 * @route   POST /auth/logout
 * @desc    Logout a user and invalidate the refresh token
 * @access  Private
 */

router.post(
  "/logout",
  authenticate,
  asyncHandler(logoutUser)
);

export default router;
