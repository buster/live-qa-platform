import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  CreateSessionResponse,
  JoinSessionResponse,
  CreateQuestionResponse,
  VoteResponse,
  MarkAnsweredResponse,
  CreateQuestionRequest,
  VoteRequest,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      const url = config.url || '';
      
      // Check if the request is for a presenter action
      if (url.includes('/answered') || url.includes('/sessions/') && config.method === 'delete') {
        const sessionId = this.extractSessionId(url);
        const presenterToken = localStorage.getItem(`presenter_token_${sessionId}`);
        
        if (presenterToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${presenterToken}`;
        }
      }
      
      return config;
    });
  }

  private extractSessionId(url: string): string {
    // Extract session ID from URL like /api/sessions/abc123 or /api/questions/abc123-xyz789/answered
    const sessionMatch = url.match(/\/sessions\/([^/]+)/);
    if (sessionMatch) return sessionMatch[1];
    
    const questionMatch = url.match(/\/questions\/([^-]+)/);
    if (questionMatch) return questionMatch[1];
    
    return '';
  }

  // Session API
  async createSession(): Promise<CreateSessionResponse> {
    const response: AxiosResponse<CreateSessionResponse> = await this.api.post('/api/sessions');
    return response.data;
  }

  async getSession(sessionId: string): Promise<JoinSessionResponse> {
    const response: AxiosResponse<JoinSessionResponse> = await this.api.get(`/api/sessions/${sessionId}`);
    return response.data;
  }

  async endSession(sessionId: string): Promise<void> {
    await this.api.delete(`/api/sessions/${sessionId}`);
  }

  // Question API
  async createQuestion(questionData: CreateQuestionRequest): Promise<CreateQuestionResponse> {
    const response: AxiosResponse<CreateQuestionResponse> = await this.api.post('/api/questions', questionData);
    return response.data;
  }

  async voteQuestion(voteData: VoteRequest): Promise<VoteResponse> {
    const response: AxiosResponse<VoteResponse> = await this.api.post(
      `/api/questions/${voteData.questionId}/vote`,
      voteData
    );
    return response.data;
  }

  async markAnswered(questionId: string): Promise<MarkAnsweredResponse> {
    const response: AxiosResponse<MarkAnsweredResponse> = await this.api.patch(
      `/api/questions/${questionId}/answered`
    );
    return response.data;
  }

  // Media upload
  async uploadMedia(file: File, sessionId: string): Promise<{ url: string; thumbnail?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response = await this.api.post('/api/media/upload', formData, config);
    return response.data;
  }
}

export const apiService = new ApiService();