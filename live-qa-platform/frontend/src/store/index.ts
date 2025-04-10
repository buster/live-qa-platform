import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import sessionReducer from './slices/sessionSlice';
import questionReducer from './slices/questionSlice';
import uiReducer from './slices/uiSlice';

// Konfiguration für Redux-Persist
const persistConfig = {
  key: 'root',
  storage,
  // Wir speichern nur die Session- und Questions-Daten, nicht den UI-Zustand
  whitelist: ['session', 'questions'],
};

// Kombiniere alle Reducer
const rootReducer = combineReducers({
  session: sessionReducer,
  questions: questionReducer,
  ui: uiReducer,
});

// Erstelle einen persistierten Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Konfiguriere den Store mit dem persistierten Reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'socket/connected',
          'socket/disconnected',
          'persist/PERSIST',
          'persist/REHYDRATE'
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: ['socket.instance', '_persist'],
      },
    }),
});

// Erstelle einen Persistor für den Store
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
