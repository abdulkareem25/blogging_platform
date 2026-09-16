import api from "../../../lib/axios";

export const getPosts = (params) => api.get("/posts", { params });
export const getPostById = (id) => api.get(`/posts/${id}`);
export const createPost = (payload) => api.post("/posts", payload);
export const updatePost = (id, payload) => api.put(`/posts/${id}`, payload);
export const deletePost = (id) => api.delete(`/posts/${id}`);
