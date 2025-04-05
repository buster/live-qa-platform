// Session types
export interface Session {
  id: string;
  createdAt: string;
  endedAt?: string;
  isActive: boolean;
}

export interface CreateSessionResponse {
  id: string;
  presenterToken: string;
  createdAt: string;
}

export interface JoinSessionResponse {
  session: Session;
  questions: Question[];
}

// Question types
export interface Question {
  id: string;
  sessionId: string;
  text: string;
  authorName: string;
  createdAt: string;
  isAnswered: boolean;
  votes: {
    up: number;
    down: number;
  };
  media?: Array<{
    type: 'image' | 'link';
    url: string;
    thumbnail?: string;
  }>;
}

export interface CreateQuestionRequest {
  sessionId: string;
  text: string;
  authorName: string;
  media?: Array<{
    type: 'image' | 'link';
    url: string;
    thumbnail?: string;
  }>;
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
  questionId: string;
  votes: {
    up: number;
    down: number;
  };
}

export interface MarkAnsweredRequest {
  questionId: string;
}

export interface MarkAnsweredResponse {
  question: Question;
}

// State types
export interface SessionState {
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
}

export interface QuestionState {
  questions: Question[];
  userVotes: Record<string, 'up' | 'down'>;
  loading: boolean;
  error: string | null;
}

export interface UIState {
  socketConnected: boolean;
  sortBy: 'votes' | 'timestamp' | 'status';
  filterAnswered: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  };
}