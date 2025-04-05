import axios from 'axios';
import {
  CreateSessionResponse,
  JoinSessionResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  VoteRequest,
  VoteResponse,
  MarkAnsweredResponse,
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class ApiService {
  // Session endpoints
  async createSession(): Promise<CreateSessionResponse> {
    const response = await api.post('/sessions');
    return response.data;
  }

  async getSession(sessionId: string): Promise<JoinSessionResponse> {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  }

  async endSession(sessionId: string): Promise<void> {
    // Get the presenter token from localStorage
    const presenterToken = localStorage.getItem(`presenter_token_${sessionId}`);
    
    if (!presenterToken) {
      throw new Error('Unauthorized: No presenter token found');
    }
    
    await api.put(
      `/sessions/${sessionId}/end`,
      {},
      {
        headers: {
          Authorization: `Bearer ${presenterToken}`,
        },
      }
    );
  }

  // Question endpoints
  async createQuestion(questionData: CreateQuestionRequest): Promise<CreateQuestionResponse> {
    const response = await api.post('/questions', questionData);
    return response.data;
  }

  async voteQuestion(voteData: VoteRequest): Promise<VoteResponse> {
    const response = await api.post(
      `/questions/${voteData.questionId}/vote`,
      {
        voterName: voteData.voterName,
        type: voteData.type,
      }
    );
    return response.data;
  }

  async markAnswered(questionId: string): Promise<MarkAnsweredResponse> {
    // Get the presenter token from localStorage
    const presenterToken = localStorage.getItem(
      `presenter_token_${questionId.split('-')[0]}`
    );
    
    if (!presenterToken) {
      throw new Error('Unauthorized: No presenter token found');
    }
    
    const response = await api.put(
      `/questions/${questionId}/answered`,
      {},
      {
        headers: {
          Authorization: `Bearer ${presenterToken}`,
        },
      }
    );
    
    return response.data;
  }
}

export const apiService = new ApiService();