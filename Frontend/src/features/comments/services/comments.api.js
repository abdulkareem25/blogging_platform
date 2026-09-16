import api from "../../../lib/axios";

export const getComments = (postId, params = {}) => api.get(`/posts/${postId}/comments`, { params });
export const addComment = (postId, payload) => api.post(`/posts/${postId}/comments`, payload);
export const deleteComment = (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`);
