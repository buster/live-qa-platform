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
        ignoredActions: ['session/joinSession/fulfilled', 'questions/createQuestion/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['session.currentSession.createdAt', 'questions.questions'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;