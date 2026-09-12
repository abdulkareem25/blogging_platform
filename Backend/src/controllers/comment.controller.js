import {
  addComment as addCommentService,
  deleteComment as deleteCommentService,
  getComments as getCommentsService,
} from "../services/comment.service.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getComments = async (req, res) => {
  const result = await getCommentsService(req.params.postId, req.query);
  return ApiResponse.paginated(res, "Comments fetched successfully", { comments: result.comments }, result.pagination);
};

export const addComment = async (req, res) => {
  const comment = await addCommentService(req.params.postId, req.user._id, req.body);
  return ApiResponse.success(res, 201, "Comment created successfully", { comment });
};

export const deleteComment = async (req, res) => {
  await deleteCommentService(req.params.commentId, req.user._id, req.user.role);
  return ApiResponse.success(res, 200, "Comment deleted successfully");
};
