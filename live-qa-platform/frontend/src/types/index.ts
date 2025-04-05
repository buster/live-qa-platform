// Session Types
export interface Session {
  id: string;
  url: string;
  createdAt: string;
  isActive: boolean;
}

export interface SessionState {
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
}

// Question Types
export interface Media {
  type: 'image' | 'link';
  url: string;
  thumbnail?: string;
}

export interface Question {
  id: string;
  sessionId: string;
  text: string;
  authorName: string;
  createdAt: string;
  isAnswered: boolean;
  media?: Media[];
  votes: {
    up: number;
    down: number;
  };
}

export interface Vote {
  id: string;
  questionId: string;
  voterName: string;
  type: 'up' | 'down';
  createdAt: string;
}

export interface QuestionState {
  questions: Question[];
  loading: boolean;
  error: string | null;
  userVotes: Record<string, 'up' | 'down' | null>;
}

// UI Types
export interface UIState {
  darkMode: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  };
  sortBy: 'votes' | 'timestamp' | 'status';
  filterAnswered: boolean;
  socketConnected: boolean;
}

// API Types
export interface CreateSessionRequest {
  // No parameters needed for session creation
}

export interface CreateSessionResponse {
  session: Session;
  presenterToken: string;
}

export interface JoinSessionRequest {
  sessionId: string;
}

export interface JoinSessionResponse {
  session: Session;
  questions: Question[];
}

export interface CreateQuestionRequest {
  sessionId: string;
  text: string;
  authorName: string;
  media?: Media[];
}

export interface CreateQuestionResponse {
  question: Question;
}

export interface VoteRequest {
  questionId: string;
  voterName: string;
  type: 'up' | 'down';
}

export interface VoteResponse {
  question: Question;
  vote: Vote;
}

export interface MarkAnsweredRequest {
  questionId: string;
}

export interface MarkAnsweredResponse {
  question: Question;
}

// Socket Types
export interface SocketEvents {
  'join:session': (sessionId: string) => void;
  'submit:question': (question: CreateQuestionRequest) => void;
  'submit:vote': (vote: VoteRequest) => void;
  'mark:answered': (questionId: string) => void;
  'question:new': (question: Question) => void;
  'question:updated': (question: Question) => void;
  'question:deleted': (questionId: string) => void;
  'vote:updated': (questionId: string, votes: { up: number; down: number }) => void;
}