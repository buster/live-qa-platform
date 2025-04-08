import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SessionState, Session } from '../../types'; // Removed unused imports, added Session

// Define the interface for session creation parameters
interface CreateSessionParams {
  presenterName: string;
  customCode?: string;
}

// Initial state
const initialState: SessionState = {
  currentSession: null,
  loading: false,
  error: null,
};

// Async thunks
export const createSession = createAsyncThunk(
  'session/create',
  async (params: CreateSessionParams | string, { rejectWithValue }) => {
    try {
      // Handle both string and object parameters for backward compatibility
      const requestData = typeof params === 'string' ? { presenterName: params } : params;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to create session');
      }

      const responseData = await response.json();

      // Check if the response has the expected structure
      if (responseData.success && responseData.data) {
        // Store presenter token in localStorage
        localStorage.setItem(
          `presenter_token_${responseData.data._id}`,
          responseData.data.presenterToken,
        );

        // Return the session data conforming to the Session type
        const sessionData: Session = {
          id: responseData.data._id,
          url: responseData.data.url,
          isActive: responseData.data.active, // Map active to isActive
          createdAt: responseData.data.createdAt,
        };
        return sessionData;
      } else {
        return rejectWithValue('Invalid response format from server');
      }
    } catch (error) {
      return rejectWithValue('Network error: Could not create session');
    }
  },
);

export const joinSession = createAsyncThunk(
  'session/join',
  async (sessionUrl: string, { rejectWithValue }) => {
    try {
      // Use the session URL, not the ID
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/sessions/${sessionUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || errorData.error || 'Failed to join session');
      }

      const responseData = await response.json();

      // Check if the response has the expected structure
      if (responseData.success && responseData.data) {
        return responseData.data;
      } else {
        return rejectWithValue('Invalid response format from server');
      }
    } catch (error) {
      return rejectWithValue('Network error: Could not join session');
    }
  },
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
          Authorization: `Bearer ${presenterToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to end session');
      }

      const responseData = await response.json();

      // Check if the response has the expected structure
      if (responseData.success) {
        // Remove presenter token from localStorage
        localStorage.removeItem(`presenter_token_${sessionId}`);
        return sessionId;
      } else {
        return rejectWithValue('Invalid response format from server');
      }
    } catch (error) {
      return rejectWithValue('Network error: Could not end session');
    }
  },
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
      .addCase(createSession.fulfilled, (state, action: PayloadAction<Session>) => {
        // Use Session type
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
      .addCase(joinSession.fulfilled, (state, action: PayloadAction<Session>) => {
        // Use Session type
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
