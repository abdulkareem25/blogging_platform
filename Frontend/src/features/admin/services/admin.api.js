import api from "../../../lib/axios";

export const getAllUsers = (params = {}) => api.get("/admin/users", { params });
export const deleteUserByAdmin = (userId) => api.delete(`/admin/users/${userId}`);
