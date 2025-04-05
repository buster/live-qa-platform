import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import questionReducer from './slices/questionSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    questions: questionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['socket/connected', 'socket/disconnected'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: ['socket.instance'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;