import { COOKIE_OPTIONS } from "../constants/index.js";
import {
  loginUser as loginUserService,
  logoutUser as logoutUserService,
  refreshUserToken as refreshUserTokenService,
  registerUser as registerUserService,
} from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const registerUser = async (req, res) => {
  const result = await registerUserService(req.body);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  return ApiResponse.success(res, 201, "User registered successfully", {
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const loginUser = async (req, res) => {
  const result = await loginUserService(req.body);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  return ApiResponse.success(res, 200, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
  });
};

export const refreshUserToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const result = await refreshUserTokenService(refreshToken);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  return ApiResponse.success(res, 200, "Token refreshed successfully", {
    accessToken: result.accessToken,
  });
};

export const logoutUser = async (req, res) => {
  await logoutUserService(req.user._id);

  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  return ApiResponse.success(res, 200, "Logged out successfully");
};
