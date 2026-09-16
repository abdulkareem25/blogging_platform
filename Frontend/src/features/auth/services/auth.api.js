import api from "../../../lib/axios";

export const getProfile = () => api.get("/users/me");
export const updateProfile = (payload) => api.put("/users/me", payload);
