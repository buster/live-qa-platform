import io, { Socket } from 'socket.io-client'; // Revert import
import { store } from '../store';
import { addQuestion, updateQuestion, removeQuestion } from '../store/slices/questionSlice';
import { setSocketConnected, showSnackbar } from '../store/slices/uiSlice';
import { Question } from '../types';

class SocketService {
  private socket: Socket | null = null; // Revert type
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect(sessionId: string): void {
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, { // Revert io usage
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => { // Remove null check
      console.log('Socket connected');
      store.dispatch(setSocketConnected(true));
      store.dispatch(showSnackbar({
        message: 'Connected to session',
        severity: 'success',
      }));

      this.socket.emit('join:session', sessionId); // Remove null check

      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => { // Remove null check
      console.log('Socket disconnected');
      store.dispatch(setSocketConnected(false));
      store.dispatch(showSnackbar({
        message: 'Disconnected from session',
        severity: 'warning',
      }));
    });

    this.socket.on('connect_error', (error: Error) => { // Remove null check, keep error type
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
    this.socket.on('question:new', (question: Question) => { // Remove null check
      store.dispatch(addQuestion(question));
    });

    this.socket.on('question:updated', (question: Question) => { // Remove null check
      store.dispatch(updateQuestion(question));
    });

    this.socket.on('question:deleted', (questionId: string) => { // Remove null check
      store.dispatch(removeQuestion(questionId));
    });

    this.socket.on('vote:updated', (questionId: string, votes: { up: number; down: number }) => { // Remove null check
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
      console.log('Emitting submit:question data (socketService):', question); // Keep logging
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