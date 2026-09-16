import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import { configureApiStore } from "../lib/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

configureApiStore(store);
