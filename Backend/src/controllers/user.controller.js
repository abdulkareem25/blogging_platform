import {
  getCurrentUser as getCurrentUserService,
  getUserPosts as getUserPostsService,
  updateCurrentUser as updateCurrentUserService,
} from "../services/user.service.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getCurrentUser = async (req, res) => {
  const user = await getCurrentUserService(req.user._id);
  return ApiResponse.success(res, 200, "Current user fetched successfully", { user });
};

export const updateCurrentUser = async (req, res) => {
  const user = await updateCurrentUserService(req.user._id, req.body);
  return ApiResponse.success(res, 200, "Profile updated successfully", { user });
};

export const getUserPosts = async (req, res) => {
  const result = await getUserPostsService(req.params.id, req.query);
  return ApiResponse.paginated(res, "User posts fetched successfully", { posts: result.posts }, result.pagination);
};
