import {configureStore} from '@reduxjs/toolkit';
import requestReducer from './request-builder/features/requestReducer';
import payloadReducer from './payloads-builder/features/payloadReducer';
import headerReducer from './header-builder/features/headerReducer';
import contextReducer from './context-builder/features/contextReducer';

export const store = configureStore({
  reducer: {
    requestReducer,
    payloadReducer,
    headerReducer,
    contextReducer,
  },
});
