import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import {
  addQuestion,
  updateQuestion,
  removeQuestion,
  setQuestions,
} from '../store/slices/questionSlice';
import { setSocketConnected, showSnackbar } from '../store/slices/uiSlice';
import { Question, Session, CreateQuestionRequest, VoteRequest } from '../types';

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

// Spezifische Typen für jede Aktion
interface QuestionOfflineAction {
  type: 'submit:question';
  payload: CreateQuestionRequest;
  timestamp: number;
}

interface VoteOfflineAction {
  type: 'submit:vote';
  payload: VoteRequest;
  timestamp: number;
}

interface AnsweredOfflineAction {
  type: 'mark:answered';
  payload: string;
  timestamp: number;
}

// Union-Typ für alle Offline-Aktionen
type OfflineAction = QuestionOfflineAction | VoteOfflineAction | AnsweredOfflineAction;

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Erhöht für bessere Wiederverbindung
  private reconnectDelay = 2000;
  private currentSessionId: string | null = null;
  private offlineQueue: OfflineAction[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;

  // Lade gespeicherte Offline-Aktionen aus dem localStorage
  private loadOfflineQueue(): void {
    const savedQueue = localStorage.getItem('offline_queue');
    if (savedQueue) {
      try {
        this.offlineQueue = JSON.parse(savedQueue);
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
        this.offlineQueue = [];
      }
    }
  }

  // Speichere Offline-Aktionen im localStorage
  private saveOfflineQueue(): void {
    localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
  }

  // Füge eine Aktion zur Offline-Warteschlange hinzu
  private addToOfflineQueue(action: OfflineAction): void {
    this.offlineQueue.push(action);
    this.saveOfflineQueue();
  }

  // Verarbeite die Offline-Warteschlange, wenn wieder verbunden
  private processOfflineQueue(): void {
    if (!this.socket || !this.socket.connected || this.offlineQueue.length === 0) return;

    console.log(`Processing offline queue (${this.offlineQueue.length} items)`);
    
    // Sortiere nach Zeitstempel
    const sortedQueue = [...this.offlineQueue].sort((a, b) => a.timestamp - b.timestamp);
    
    // Leere die Warteschlange
    this.offlineQueue = [];
    this.saveOfflineQueue();
    
    // Verarbeite jede Aktion
    sortedQueue.forEach((action) => {
      if (!this.socket) return;
      
      switch (action.type) {
        case 'submit:question':
          this.socket.emit('submit:question', action.payload);
          break;
        case 'submit:vote':
          this.socket.emit('submit:vote', action.payload);
          break;
        case 'mark:answered':
          this.socket.emit('mark:answered', action.payload);
          break;
      }
    });
    
    store.dispatch(
      showSnackbar({
        message: `${sortedQueue.length} offline Aktionen wurden synchronisiert`,
        severity: 'success',
      }),
    );
  }

  // Starte einen automatischen Wiederverbindungsversuch
  private startReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (!this.currentSessionId || this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect...');
      if (this.currentSessionId) {
        this.connect(this.currentSessionId);
      }
      this.isReconnecting = false;
    }, this.reconnectDelay);
  }

  connect(sessionId: string): void {
    // Speichere die aktuelle Session-ID für Wiederverbindungen
    this.currentSessionId = sessionId;
    
    // Lade gespeicherte Offline-Aktionen
    this.loadOfflineQueue();
    
    if (this.socket) {
      this.disconnect();
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      // Erhöhe Timeout für bessere Netzwerktoleranz
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(setSocketConnected(true));
      store.dispatch(
        showSnackbar({
          message: 'Verbunden mit der Session',
          severity: 'success',
        }),
      );

      if (this.socket) {
        this.socket.emit('join:session', sessionId);
      }

      this.reconnectAttempts = 0;
      
      // Verarbeite die Offline-Warteschlange nach erfolgreicher Verbindung
      this.processOfflineQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      store.dispatch(setSocketConnected(false));
      store.dispatch(
        showSnackbar({
          message: 'Verbindung zur Session unterbrochen. Versuche automatisch, wieder zu verbinden...',
          severity: 'warning',
        }),
      );
      
      // Starte automatischen Wiederverbindungsversuch
      this.startReconnectTimer();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      store.dispatch(setSocketConnected(false));

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        store.dispatch(
          showSnackbar({
            message: 'Verbindung zur Session fehlgeschlagen. Die App funktioniert im Offline-Modus.',
            severity: 'error',
          }),
        );
      } else {
        // Starte automatischen Wiederverbindungsversuch
        this.startReconnectTimer();
      }
    });

    // Handle session joined event
    this.socket.on('session:joined', (data: { session: Session; questions: Question[] }) => {
      console.log('Received session:joined data:', data);
      
      // Nur setzen, wenn keine Fragen im Store sind oder wenn die Anzahl unterschiedlich ist
      // Dies verhindert, dass lokale Änderungen überschrieben werden
      const state = store.getState();
      if (
        state.questions.questions.length === 0 ||
        state.questions.questions.length !== data.questions.length
      ) {
        store.dispatch(setQuestions(data.questions));
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
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.currentSessionId = null;
    this.isReconnecting = false;
  }

  submitQuestion(question: CreateQuestionRequest): void {
    // Optimistisches Update - füge die Frage lokal hinzu
    const tempId = `temp-${Date.now()}`;
    const tempQuestion: Question = {
      id: tempId,
      sessionId: question.sessionId,
      text: question.text,
      authorName: question.authorName,
      createdAt: new Date().toISOString(),
      isAnswered: false,
      media: question.media,
      votes: { up: 0, down: 0 },
    };
    
    // Füge die temporäre Frage zum Store hinzu
    store.dispatch(addQuestion(tempQuestion));
    
    if (this.socket && this.socket.connected) {
      console.log('Emitting submit:question data:', question);
      this.socket.emit('submit:question', question);
    } else {
      // Füge zur Offline-Warteschlange hinzu
      this.addToOfflineQueue({
        type: 'submit:question',
        payload: question,
        timestamp: Date.now(),
      });
      
      store.dispatch(
        showSnackbar({
          message: 'Frage im Offline-Modus gespeichert. Sie wird gesendet, sobald die Verbindung wiederhergestellt ist.',
          severity: 'info',
        }),
      );
    }
  }

  submitVote(vote: VoteRequest): void {
    // Optimistisches Update - aktualisiere den Vote lokal
    const state = store.getState();
    const question = state.questions.questions.find((q) => q.id === vote.questionId);
    
    if (question) {
      // Berechne die neuen Votes basierend auf dem aktuellen Zustand
      const newVotes = { ...question.votes };
      
      // Prüfe, ob der Benutzer bereits abgestimmt hat
      const existingVote = state.questions.userVotes[`${vote.voterName}-${vote.questionId}`];
      
      if (existingVote === vote.type) {
        // Benutzer stimmt erneut für die gleiche Option ab - entferne die Stimme
        if (vote.type === 'up') newVotes.up = Math.max(0, newVotes.up - 1);
        if (vote.type === 'down') newVotes.down = Math.max(0, newVotes.down - 1);
      } else if (existingVote) {
        // Benutzer ändert seine Stimme
        if (existingVote === 'up') newVotes.up = Math.max(0, newVotes.up - 1);
        if (existingVote === 'down') newVotes.down = Math.max(0, newVotes.down - 1);
        
        if (vote.type === 'up') newVotes.up += 1;
        if (vote.type === 'down') newVotes.down += 1;
      } else {
        // Neue Stimme
        if (vote.type === 'up') newVotes.up += 1;
        if (vote.type === 'down') newVotes.down += 1;
      }
      
      // Aktualisiere die Frage mit den neuen Votes
      const updatedQuestion = {
        ...question,
        votes: newVotes,
      };
      
      store.dispatch(updateQuestion(updatedQuestion));
    }
    
    if (this.socket && this.socket.connected) {
      console.log('Emitting submit:vote data:', vote);
      this.socket.emit('submit:vote', vote);
    } else {
      // Füge zur Offline-Warteschlange hinzu
      this.addToOfflineQueue({
        type: 'submit:vote',
        payload: vote,
        timestamp: Date.now(),
      });
      
      store.dispatch(
        showSnackbar({
          message: 'Stimme im Offline-Modus gespeichert. Sie wird gesendet, sobald die Verbindung wiederhergestellt ist.',
          severity: 'info',
        }),
      );
    }
  }

  markAnswered(questionId: string): void {
    // Optimistisches Update - markiere die Frage lokal als beantwortet
    const state = store.getState();
    const question = state.questions.questions.find((q) => q.id === questionId);
    
    if (question) {
      const updatedQuestion = {
        ...question,
        isAnswered: true,
      };
      
      store.dispatch(updateQuestion(updatedQuestion));
    }
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark:answered', questionId);
    } else {
      // Füge zur Offline-Warteschlange hinzu
      this.addToOfflineQueue({
        type: 'mark:answered',
        payload: questionId,
        timestamp: Date.now(),
      });
      
      store.dispatch(
        showSnackbar({
          message: 'Frage im Offline-Modus als beantwortet markiert. Die Änderung wird synchronisiert, sobald die Verbindung wiederhergestellt ist.',
          severity: 'info',
        }),
      );
    }
  }
}

export const socketService = new SocketService();
