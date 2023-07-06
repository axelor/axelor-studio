import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';

export const sendRequest = createAsyncThunk(
    'company/fetchCompany',
    async function(data) {
      return sendRequest(data)
          .catch(function(error) {
            console.log(error);
          })
          .then((response) => response.data.data);
    },
);

export const requestSlice = createSlice({
  name: 'counter',
  initialState: {
    modelParameters: [],
  },
  reducers: {
    updateModelParam: (state, action) => {
      state.modelParameters = action.payload;
    },
    addModelParam: (state, action) => {
      state.modelParameters.push({
        ...action.payload,
        parameters: [{id: 1, wsKey: '', wsValue: ''}],
      });
    },
    deleteModelParam: (state, action) => {
      state.modelParameters = state.modelParameters.filter(
          (modelParam) => modelParam.id !== action.payload,
      );
    },
  },
});

// Action creators are generated for each case reducer function
export const {updateModelParam, addModelParam, deleteModelParam} =
  requestSlice.actions;
const requestReducer = requestSlice.reducer;
export default requestReducer;
