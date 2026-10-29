import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import audioReducer from './audioSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    audio: audioReducer,
  },
});

export default store;
