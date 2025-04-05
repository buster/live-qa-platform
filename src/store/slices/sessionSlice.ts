import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import { SessionState, CreateSessionResponse, JoinSessionResponse } from '../../types';

const initialState: SessionState = {
  currentSession: null,
  loading: false,
  error: null,
};

export const createSession = createAsyncThunk(
  'session/create',
  async () => {
    const response = await apiService.createSession();
    // Store the presenter token in localStorage
    localStorage.setItem(`presenter_token_${response.id}`, response.presenterToken);
    return response;
  }
);

export const joinSession = createAsyncThunk(
  'session/join',
  async (sessionId: string) => {
    const response = await apiService.getSession(sessionId);
    return response;
  }
);

export const endSession = createAsyncThunk(
  'session/end',
  async (sessionId: string) => {
    await apiService.endSession(sessionId);
    return sessionId;
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    clearSession: (state) => {
      state.currentSession = null;
      state.error = null;
    },
    setSessionError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = {
          id: action.payload.id,
          createdAt: action.payload.createdAt,
          isActive: true,
        };
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create session';
      })
      
      // Join session
      .addCase(joinSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload.session;
      })
      .addCase(joinSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to join session';
      })
      
      // End session
      .addCase(endSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endSession.fulfilled, (state) => {
        state.loading = false;
        if (state.currentSession) {
          state.currentSession.isActive = false;
          state.currentSession.endedAt = new Date().toISOString();
        }
      })
      .addCase(endSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to end session';
      });
  },
});

export const { clearSession, setSessionError } = sessionSlice.actions;

export default sessionSlice.reducer;