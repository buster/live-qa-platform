import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

// Initial state
const initialState: UIState = {
  darkMode: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
  sortBy: 'votes',
  filterAnswered: false,
  socketConnected: false,
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    showSnackbar: (state, action: PayloadAction<{
      message: string;
      severity: 'success' | 'info' | 'warning' | 'error';
    }>) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
    setSortBy: (state, action: PayloadAction<'votes' | 'timestamp' | 'status'>) => {
      state.sortBy = action.payload;
    },
    toggleFilterAnswered: (state) => {
      state.filterAnswered = !state.filterAnswered;
    },
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
  },
});

export const {
  toggleDarkMode,
  showSnackbar,
  hideSnackbar,
  setSortBy,
  toggleFilterAnswered,
  setSocketConnected,
} = uiSlice.actions;

export default uiSlice.reducer;