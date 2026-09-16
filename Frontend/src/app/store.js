import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/authSlice";
import uiReducer from "../features/ui/store/uiSlice";
import { configureApiStore } from "../lib/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

configureApiStore(store);
