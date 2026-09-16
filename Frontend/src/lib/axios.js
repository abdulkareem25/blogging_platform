import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;
let storeAccess = null;

export const configureApiStore = (store) => {
  storeAccess = store;
};

api.interceptors.request.use((config) => {
  const token = storeAccess?.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest?._retry || originalRequest?.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= api.post("/auth/refresh").then(({ data }) => {
      const token = data.data.accessToken;
      storeAccess?.dispatch({ type: "auth/setAccessToken", payload: token });
      return token;
    }).catch((refreshError) => {
      storeAccess?.dispatch({ type: "auth/clearAuth" });
      throw refreshError;
    }).finally(() => {
      refreshPromise = null;
    });

    const token = await refreshPromise;
    originalRequest.headers.Authorization = `Bearer ${token}`;
    return api(originalRequest);
  },
);

export default api;
