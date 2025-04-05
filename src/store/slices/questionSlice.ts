import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';
import {
  QuestionState,
  Question,
  CreateQuestionRequest,
  VoteRequest,
  MarkAnsweredRequest,
} from '../../types';

const initialState: QuestionState = {
  questions: [],
  userVotes: {},
  loading: false,
  error: null,
};

export const createQuestion = createAsyncThunk(
  'questions/createQuestion',
  async (questionData: CreateQuestionRequest) => {
    const response = await apiService.createQuestion(questionData);
    return response.question;
  }
);

export const voteQuestion = createAsyncThunk(
  'questions/voteQuestion',
  async (voteData: VoteRequest) => {
    const response = await apiService.voteQuestion(voteData);
    
    return {
      questionId: voteData.questionId,
      voterName: voteData.voterName,
      voteType: voteData.type,
      votes: response.votes,
    };
  }
);

export const markAnswered = createAsyncThunk(
  'questions/markAnswered',
  async (markData: MarkAnsweredRequest) => {
    // Get the presenter token from localStorage
    const presenterToken = localStorage.getItem(
      `presenter_token_${markData.questionId.split('-')[0]}`
    );
    
    if (!presenterToken) {
      throw new Error('Unauthorized: No presenter token found');
    }
    
    const response = await apiService.markAnswered(
      markData.questionId
    );
    
    return response.question;
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    addQuestion: (state, action) => {
      state.questions.push(action.payload);
    },
    updateQuestion: (state, action) => {
      const index = state.questions.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.questions[index] = action.payload;
      }
    },
    removeQuestion: (state, action) => {
      state.questions = state.questions.filter(q => q.id !== action.payload);
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    clearQuestions: (state) => {
      state.questions = [];
      state.userVotes = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.questions.push(action.payload);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create question';
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
          action
        ) => {
          state.loading = false;
          
          // Update the question votes
          const index = state.questions.findIndex((q) => 
            q.id === action.payload.questionId
          );
          
          if (index !== -1) {
            state.questions[index].votes = action.payload.votes;
          }
          
          // Store the user's vote
          const voteKey = `${action.payload.voterName}-${action.payload.questionId}`;
          state.userVotes[voteKey] = action.payload.voteType;
        }
      )
      .addCase(voteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to vote on question';
      })
      
      // Mark answered
      .addCase(markAnswered.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAnswered.fulfilled, (state, action) => {
        state.loading = false;
        
        const index = state.questions.findIndex((q) => q.id === action.payload.id);
        if (index !== -1) {
          state.questions[index] = action.payload;
        }
      })
      .addCase(markAnswered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to mark question as answered';
      });
  },
});

export const {
  addQuestion,
  updateQuestion,
  removeQuestion,
  setQuestions,
  clearQuestions,
} = questionSlice.actions;

export default questionSlice.reducer;