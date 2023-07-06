import {createSlice} from '@reduxjs/toolkit';

export const contextSlice = createSlice({
  name: 'terget',
  initialState: {
    targets: [],
  },
  reducers: {
    updateTarget: (state, action) => {
      state.targets = action.payload;
    },
    addTarget: (state) => {
      state.targets.push({model: null, target: null});
    },
    deleteTarget: (state, action) => {
      state.targets = state.targets.filter(
          (target) => target.id !== action.payload,
      );
    },
  },
});

// Action creators are generated for each case reducer function
export const {updateTarget, addTarget, deleteTarget} = contextSlice.actions;
const contextReducer = contextSlice.reducer;
export default contextReducer;
