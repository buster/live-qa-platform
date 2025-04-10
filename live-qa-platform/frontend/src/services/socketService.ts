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
    this.socket.on('session:joined', (data: { session: any; questions: any[] }) => {
      console.log('Received session:joined data:', data);
      
      // Transform session to match frontend types (rename _id to id)
      const transformedSession: Session = {
        ...data.session,
        id: data.session._id || data.session.id
      };
      
      // Transform questions to match frontend types (rename _id to id)
      const transformedQuestions: Question[] = data.questions.map(q => ({
        ...q,
        id: q._id || q.id,
        sessionId: typeof q.sessionId === 'object' && q.sessionId._id ? q.sessionId._id : q.sessionId
      }));
      
      console.log('Transformed questions:', transformedQuestions);
      
      // Log each transformed question to check if they have valid IDs
      if (transformedQuestions.length > 0) {
        console.log('Transformed questions with IDs:');
        transformedQuestions.forEach((q, index) => {
          console.log(`Question ${index}:`, q);
          console.log(`Question ${index} ID:`, q.id);
        });
      } else {
        console.log('No questions received in session:joined event');
      }
      
      // Dispatch action to set initial questions
      store.dispatch(setQuestions(transformedQuestions));
    });

    // Handle other incoming events
    // Handle incoming events
    this.socket.on('question:new', (question: any) => {
      // Add logging to debug question object
      console.log('Received question:new event with question:', question);
      
      // Transform question to match frontend types (rename _id to id)
      const transformedQuestion: Question = {
        ...question,
        id: question._id || question.id,
        sessionId: typeof question.sessionId === 'object' && question.sessionId._id ? question.sessionId._id : question.sessionId
      };
      
      console.log('Transformed question:', transformedQuestion);
      console.log('Transformed question ID:', transformedQuestion.id);
      
      // Dispatch action to add question to store
      store.dispatch(addQuestion(transformedQuestion));
    });

    this.socket.on('question:updated', (question: any) => {
      // Transform question to match frontend types (rename _id to id)
      const transformedQuestion: Question = {
        ...question,
        id: question._id || question.id,
        sessionId: typeof question.sessionId === 'object' && question.sessionId._id ? question.sessionId._id : question.sessionId
      };
      
      console.log('Received question:updated event with transformed question:', transformedQuestion);
      
      // Dispatch action to update question in store
      store.dispatch(updateQuestion(transformedQuestion));
    });

    this.socket.on('question:deleted', (questionId: string) => {
      // Remove null check
      store.dispatch(removeQuestion(questionId));
    });

    this.socket.on('vote:updated', (questionId: string, votes: { up: number; down: number }) => {
      console.log('Received vote:updated event with questionId:', questionId, 'votes:', votes);
      
      // Check if questionId is MongoDB _id format and find question
      const state = store.getState();
      
      // Try to find question by id
      // First try to find by exact match
      let question = state.questions.questions.find((q) => q.id === questionId);
      
      // If not found, try to find by partial match (in case MongoDB _id is used)
      if (!question && questionId.length >= 24) {
        // MongoDB IDs are typically 24 characters
        question = state.questions.questions.find((q) =>
          q.id.includes(questionId) || questionId.includes(q.id)
        );
      }
      
      console.log('Found question for vote update:', question);

      if (question) {
        const updatedQuestion = {
          ...question,
          votes,
        };
        console.log('Updating question with votes:', updatedQuestion);
        store.dispatch(updateQuestion(updatedQuestion));
      } else {
        console.error('Question not found for vote update. ID:', questionId);
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
      console.log('Emitting submit:vote data (socketService):', vote);
      
      // Make sure we're using the correct questionId format
      // If the questionId contains a hyphen, it might be a client-side ID
      // Extract the MongoDB ObjectId part (before the first hyphen)
      const questionId = vote.questionId.includes('-')
        ? vote.questionId.split('-')[0]
        : vote.questionId;
      
      const transformedVote = {
        ...vote,
        questionId
      };
      
      console.log('Transformed vote data:', transformedVote);
      
      this.socket.emit('submit:vote', transformedVote);
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
      console.log('Marking question as answered, original questionId:', questionId);
      
      // Make sure we're using the correct questionId format
      // If the questionId contains a hyphen, it might be a client-side ID
      // Extract the MongoDB ObjectId part (before the first hyphen)
      const transformedQuestionId = questionId.includes('-')
        ? questionId.split('-')[0]
        : questionId;
      
      console.log('Transformed questionId for mark:answered:', transformedQuestionId);
      
      this.socket.emit('mark:answered', transformedQuestionId);
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
