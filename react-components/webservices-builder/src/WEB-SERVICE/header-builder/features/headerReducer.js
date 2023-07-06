import { createSlice } from "@reduxjs/toolkit";

export const headerSlice = createSlice({
  name: "counter",
  initialState: {
    headers: [],
  },
  reducers: {
    updateHeader: (state, action) => {
      state.headers = action.payload;
    },
    addHeader: (state, action) => {
      state.modelHeaders.push({
        ...action.payload,
        headers: [{ wsKey: "", wsValue: "" }],
      });
    },
    deleteHeader: (state, action) => {
      state.headers = state.headers.filter(
        (header) => header.id !== action.payload
      );
    },
  },
});

// Action creators are generated for each case reducer function
export const { updateHeader, addHeader, deleteHeader } = headerSlice.actions;
const headerReducer = headerSlice.reducer;
export default headerReducer;
