import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../lib/axios";

export const initializeAuth = createAsyncThunk("auth/initialize", async () => {
  const { data } = await api.post("/auth/refresh");
  return data.data.accessToken;
});

export const loginUser = createAsyncThunk("auth/login", async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data.data;
});

export const registerUser = createAsyncThunk("auth/register", async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return data.data;
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { dispatch }) => {
  await api.post("/auth/logout");
  dispatch(clearAuth());
});

const initialState = { user: null, accessToken: null, status: "loading", error: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAccessToken: (state, action) => { state.accessToken = action.payload; },
    clearAuth: () => ({ ...initialState, status: "ready" }),
    updateUser: (state, action) => { state.user = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.fulfilled, (state, action) => { state.accessToken = action.payload; state.status = "ready"; })
      .addCase(initializeAuth.rejected, (state) => { state.status = "ready"; state.accessToken = null; })
      .addCase(loginUser.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.status = "ready"; })
      .addCase(loginUser.rejected, (state, action) => { state.status = "ready"; state.error = action.error.message; })
      .addCase(registerUser.fulfilled, (state, action) => { state.user = action.payload.user; state.accessToken = action.payload.accessToken; state.status = "ready"; })
      .addCase(registerUser.rejected, (state, action) => { state.status = "ready"; state.error = action.error.message; });
  },
});

export const { setAccessToken, clearAuth, updateUser } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);
export default authSlice.reducer;
