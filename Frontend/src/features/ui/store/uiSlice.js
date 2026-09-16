import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toast: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
  },
});

export const { setToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
