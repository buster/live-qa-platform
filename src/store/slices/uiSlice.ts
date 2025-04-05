import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  socketConnected: false,
  sortBy: 'votes',
  filterAnswered: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.socketConnected = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'votes' | 'timestamp' | 'status'>) => {
      state.sortBy = action.payload;
    },
    toggleFilterAnswered: (state) => {
      state.filterAnswered = !state.filterAnswered;
    },
    showSnackbar: (
      state,
      action: PayloadAction<{
        message: string;
        severity: 'success' | 'info' | 'warning' | 'error';
      }>
    ) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
  },
});

export const {
  setSocketConnected,
  setSortBy,
  toggleFilterAnswered,
  showSnackbar,
  hideSnackbar,
} = uiSlice.actions;

export default uiSlice.reducer;