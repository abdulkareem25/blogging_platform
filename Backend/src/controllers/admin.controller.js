import {
  deleteUserByAdmin as deleteUserByAdminService,
  getAllUsers as getAllUsersService,
} from "../services/user.service.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getAllUsers = async (req, res) => {
  const result = await getAllUsersService(req.query);
  return ApiResponse.paginated(res, "Users fetched successfully", { users: result.users }, result.pagination);
};

export const deleteUserByAdmin = async (req, res) => {
  await deleteUserByAdminService(req.params.id);
  return ApiResponse.success(res, 200, "User deleted successfully");
};
