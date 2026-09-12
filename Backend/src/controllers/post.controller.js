import {
  createPost as createPostService,
  deletePost as deletePostService,
  getPostById as getPostByIdService,
  getPosts as getPostsService,
  updatePost as updatePostService,
} from "../services/post.service.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getPosts = async (req, res) => {
  const result = await getPostsService(req.query);
  return ApiResponse.paginated(res, "Posts fetched successfully", { posts: result.posts }, result.pagination);
};

export const createPost = async (req, res) => {
  const post = await createPostService(req.user._id, req.body);
  return ApiResponse.success(res, 201, "Post created successfully", { post });
};

export const getPostById = async (req, res) => {
  const post = await getPostByIdService(req.params.id);
  return ApiResponse.success(res, 200, "Post fetched successfully", { post });
};

export const updatePost = async (req, res) => {
  const post = await updatePostService(req.params.id, req.user._id, req.user.role, req.body);
  return ApiResponse.success(res, 200, "Post updated successfully", { post });
};

export const deletePost = async (req, res) => {
  await deletePostService(req.params.id, req.user._id, req.user.role);
  return ApiResponse.success(res, 200, "Post deleted successfully");
};
