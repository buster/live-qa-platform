import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addQuestion, updateQuestion, removeQuestion } from '../store/slices/questionSlice';
import { setSocketConnected, showSnackbar } from '../store/slices/uiSlice';
import { Question } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect(sessionId: string): void {
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(setSocketConnected(true));
      store.dispatch(showSnackbar({
        message: 'Connected to session',
        severity: 'success',
      }));
      
      // Join the session room
      this.socket.emit('join:session', sessionId);
      
      // Reset reconnect attempts
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      store.dispatch(setSocketConnected(false));
      store.dispatch(showSnackbar({
        message: 'Disconnected from session',
        severity: 'warning',
      }));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(showSnackbar({
          message: 'Failed to connect to session. Please refresh the page.',
          severity: 'error',
        }));
      }
    });

    // Handle incoming events
    this.socket.on('question:new', (question: Question) => {
      store.dispatch(addQuestion(question));
    });

    this.socket.on('question:updated', (question: Question) => {
      store.dispatch(updateQuestion(question));
    });

    this.socket.on('question:deleted', (questionId: string) => {
      store.dispatch(removeQuestion(questionId));
    });

    this.socket.on('vote:updated', (questionId: string, votes: { up: number; down: number }) => {
      // We need to update the question with the new votes
      const state = store.getState();
      const question = state.questions.questions.find(q => q.id === questionId);
      
      if (question) {
        const updatedQuestion = {
          ...question,
          votes,
        };
        store.dispatch(updateQuestion(updatedQuestion));
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setSocketConnected(false));
    }
  }

  submitQuestion(question: {
    sessionId: string;
    text: string;
    authorName: string;
    media?: Array<{ type: 'image' | 'link'; url: string; thumbnail?: string }>;
  }): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('submit:question', question);
    } else {
      store.dispatch(showSnackbar({
        message: 'Not connected to session. Please refresh the page.',
        severity: 'error',
      }));
    }
  }

  submitVote(vote: {
    questionId: string;
    voterName: string;
    type: 'up' | 'down';
  }): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('submit:vote', vote);
    } else {
      store.dispatch(showSnackbar({
        message: 'Not connected to session. Please refresh the page.',
        severity: 'error',
      }));
    }
  }

  markAnswered(questionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark:answered', questionId);
    } else {
      store.dispatch(showSnackbar({
        message: 'Not connected to session. Please refresh the page.',
        severity: 'error',
      }));
    }
  }
}

export const socketService = new SocketService();