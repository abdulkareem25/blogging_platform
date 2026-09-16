import api from "../../../lib/axios";

export const getUserPosts = (userId, params = {}) => api.get(`/users/${userId}/posts`, { params });
export const getCurrentUser = () => api.get("/users/me");
export const updateCurrentUser = (payload) => api.put("/users/me", payload);
