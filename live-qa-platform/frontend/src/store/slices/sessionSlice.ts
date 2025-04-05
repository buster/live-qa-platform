import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SessionState, CreateSessionResponse, JoinSessionResponse } from '../../types';

// Initial state
const initialState: SessionState = {
  currentSession: null,
  loading: false,
  error: null,
};

// Async thunks
export const createSession = createAsyncThunk(
  'session/create',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to create session');
      }

      const data: CreateSessionResponse = await response.json();
      
      // Store presenter token in localStorage
      localStorage.setItem(`presenter_token_${data.session.id}`, data.presenterToken);
      
      return data.session;
    } catch (error) {
      return rejectWithValue('Network error: Could not create session');
    }
  }
);

export const joinSession = createAsyncThunk(
  'session/join',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to join session');
      }

      const data: JoinSessionResponse = await response.json();
      return data.session;
    } catch (error) {
      return rejectWithValue('Network error: Could not join session');
    }
  }
);

export const endSession = createAsyncThunk(
  'session/end',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const presenterToken = localStorage.getItem(`presenter_token_${sessionId}`);
      
      if (!presenterToken) {
        return rejectWithValue('Unauthorized: Missing presenter token');
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${presenterToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to end session');
      }

      // Remove presenter token from localStorage
      localStorage.removeItem(`presenter_token_${sessionId}`);
      
      return sessionId;
    } catch (error) {
      return rejectWithValue('Network error: Could not end session');
    }
  }
);

// Slice
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    clearSession: (state) => {
      state.currentSession = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Join session
      .addCase(joinSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(joinSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // End session
      .addCase(endSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endSession.fulfilled, (state) => {
        state.loading = false;
        state.currentSession = null;
      })
      .addCase(endSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSession, clearError } = sessionSlice.actions;

export default sessionSlice.reducer;