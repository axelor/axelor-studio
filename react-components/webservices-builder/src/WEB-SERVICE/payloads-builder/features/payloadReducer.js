import {createSlice} from '@reduxjs/toolkit';

export const payloadSlice = createSlice({
  name: 'counter',
  initialState: {
    modelPayloads: [],
    queryCriteria:{}
  },
  reducers: {
    updateModelPayload: (state, action) => {
      state.modelPayloads = action.payload;
    },
    addModelPayload: (state, action) => {
      state.modelPayloads.push({
        ...action.payload,
        payloads: [
          {
            id: 1,
            wsKey: '',
            wsValue: '',
            isList: false,
            subKeyValues: [],
            type: 'Basic',
          },
        ],
      });
    },
    deleteModelPayload: (state, action) => {
      state.modelPayloads = state.modelPayloads.filter(
          (modelPayload) => modelPayload.id !== action.payload,
      );
    },
    updateCriteria: (state, action) => {
      state.queryCriteria = action.payload;
    },
  },
});
export const {updateModelPayload, addModelPayload, deleteModelPayload,updateCriteria} =
  payloadSlice.actions;
const payloadReducer = payloadSlice.reducer;
export default payloadReducer;
