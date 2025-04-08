import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  QuestionState,
  Question,
  CreateQuestionRequest,
  VoteRequest,
  MarkAnsweredRequest,
} from '../../types';

// Initial state
const initialState: QuestionState = {
  questions: [],
  loading: false,
  error: null,
  userVotes: {},
};

// Async thunks
export const createQuestion = createAsyncThunk(
  'questions/create',
  async (questionData: CreateQuestionRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to create question');
      }

      const data = await response.json();
      return data.question;
    } catch (error) {
      return rejectWithValue('Network error: Could not create question');
    }
  },
);

export const voteQuestion = createAsyncThunk(
  'questions/vote',
  async (voteData: VoteRequest, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/questions/${voteData.questionId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(voteData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to vote on question');
      }

      const data = await response.json();
      return {
        question: data.question,
        voteType: voteData.type,
        voterName: voteData.voterName,
      };
    } catch (error) {
      return rejectWithValue('Network error: Could not vote on question');
    }
  },
);

export const markAnswered = createAsyncThunk(
  'questions/markAnswered',
  async (markData: MarkAnsweredRequest, { rejectWithValue }) => {
    try {
      const presenterToken = localStorage.getItem(
        `presenter_token_${markData.questionId.split('-')[0]}`,
      );

      if (!presenterToken) {
        return rejectWithValue('Unauthorized: Missing presenter token');
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/questions/${markData.questionId}/answered`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${presenterToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to mark question as answered');
      }

      const data = await response.json();
      return data.question;
    } catch (error) {
      return rejectWithValue('Network error: Could not mark question as answered');
    }
  },
);

// Slice
const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    addQuestion: (state, action: PayloadAction<Question>) => {
      state.questions.push(action.payload);
    },
    updateQuestion: (state, action: PayloadAction<Question>) => {
      const index = state.questions.findIndex((q) => q.id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = action.payload;
      }
    },
    removeQuestion: (state, action: PayloadAction<string>) => {
      state.questions = state.questions.filter((q) => q.id !== action.payload);
    },
    clearQuestions: (state) => {
      state.questions = [];
      state.userVotes = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        state.questions.push(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Vote question
      .addCase(voteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        voteQuestion.fulfilled,
        (
          state,
          action: PayloadAction<{
            question: Question;
            voteType: 'up' | 'down';
            voterName: string;
          }>,
        ) => {
          state.loading = false;
          const { question, voteType, voterName } = action.payload;

          // Update the question
          const index = state.questions.findIndex((q) => q.id === question.id);
          if (index !== -1) {
            state.questions[index] = question;
          }

          // Store the user's vote
          const voterKey = `${voterName}-${question.id}`;
          state.userVotes[voterKey] = voteType;
        },
      )
      .addCase(voteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Mark answered
      .addCase(markAnswered.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAnswered.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        const index = state.questions.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
      })
      .addCase(markAnswered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setQuestions,
  addQuestion,
  updateQuestion,
  removeQuestion,
  clearQuestions,
  clearError,
} = questionSlice.actions;

export default questionSlice.reducer;
