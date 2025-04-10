import { io, Socket } from 'socket.io-client'; // Correct import based on docs
import { store } from '../store';
import {
  addQuestion,
  updateQuestion,
  removeQuestion,
  setQuestions,
} from '../store/slices/questionSlice';
import { setSocketConnected, showSnackbar } from '../store/slices/uiSlice';
import { Question, Session } from '../types';

// Define event types based on usage in this service
interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
  'session:joined': (data: { session: Session; questions: Question[] }) => void;
  'question:new': (question: Question) => void;
  'question:updated': (question: Question) => void;
  'question:deleted': (questionId: string) => void;
  'vote:updated': (questionId: string, votes: { up: number; down: number }) => void;
}

interface ClientToServerEvents {
  'join:session': (sessionId: string) => void;
  'submit:question': (question: {
    sessionId: string;
    text: string;
    authorName: string;
    media?: Array<{ type: 'image' | 'link'; url: string; thumbnail?: string }>;
  }) => void;
  'submit:vote': (vote: { questionId: string; voterName: string; type: 'up' | 'down' }) => void;
  'mark:answered': (questionId: string) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null; // Use typed Socket
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  connect(sessionId: string): void {
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, {
      // Revert io usage
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      // Remove null check
      console.log('Socket connected');
      store.dispatch(setSocketConnected(true));
      store.dispatch(
        showSnackbar({
          message: 'Connected to session',
          severity: 'success',
        }),
      );

      if (this.socket) {
        // Add null check for TypeScript
        this.socket.emit('join:session', sessionId);
      }

      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      // Remove null check
      console.log('Socket disconnected');
      store.dispatch(setSocketConnected(false));
      store.dispatch(
        showSnackbar({
          message: 'Disconnected from session',
          severity: 'warning',
        }),
      );
    });

    this.socket.on('connect_error', (error: Error) => {
      // Remove null check, keep error type
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(
          showSnackbar({
            message: 'Failed to connect to session. Please refresh the page.',
            severity: 'error',
          }),
        );
      }
    });
    // Handle session joined event
    this.socket.on('session:joined', (data: { session: Session; questions: Question[] }) => {
      console.log('Received session:joined data:', data); // Optional: Logging
      // Dispatch action to set initial questions
      store.dispatch(setQuestions(data.questions));
    });

    // Handle other incoming events
    // Handle incoming events
    this.socket.on('question:new', (question: Question) => {
      // Remove null check
      store.dispatch(addQuestion(question));
    });

    this.socket.on('question:updated', (question: Question) => {
      // Remove null check
      store.dispatch(updateQuestion(question));
    });

    this.socket.on('question:deleted', (questionId: string) => {
      // Remove null check
      store.dispatch(removeQuestion(questionId));
    });

    this.socket.on('vote:updated', (questionId: string, votes: { up: number; down: number }) => {
      // Remove null check
      const state = store.getState();
      const question = state.questions.questions.find((q) => q.id === questionId);

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
      store.dispatch(
        showSnackbar({
          message: 'Not connected to session. Please refresh the page.',
          severity: 'error',
        }),
      );
    }
  }

  submitVote(vote: { questionId: string; voterName: string; type: 'up' | 'down' }): void {
    if (this.socket && this.socket.connected) {
      console.log('Emitting submit:vote data (socketService):', vote); // Add log before emit
      this.socket.emit('submit:vote', vote);
    } else {
      store.dispatch(
        showSnackbar({
          message: 'Not connected to session. Please refresh the page.',
          severity: 'error',
        }),
      );
    }
  }

  markAnswered(questionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark:answered', questionId);
    } else {
      store.dispatch(
        showSnackbar({
          message: 'Not connected to session. Please refresh the page.',
          severity: 'error',
        }),
      );
    }
  }
}

export const socketService = new SocketService();
