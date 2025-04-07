import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import SessionService from '../services/SessionService';
import QuestionService from '../services/QuestionService';
import SessionRepository from '../repositories/SessionRepository';
import QuestionRepository from '../repositories/QuestionRepository';
import VoteRepository from '../repositories/VoteRepository';
import { authenticateSocket, isPresenter } from '../middleware/socketAuth';
import { RateLimiterMemory } from 'rate-limiter-flexible';

/**
 * WebSocket server for real-time communication
 */
export default class SocketServer {
  private io: SocketIOServer;
  private sessionService: SessionService;
  private questionService: QuestionService;
  private questionRateLimiter: RateLimiterMemory;
  private voteRateLimiter: RateLimiterMemory;

  /**
   * Create a new SocketServer
   * @param server HTTP server
   */
  constructor(server: HttpServer) {
    // Initialize Socket.io server
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Initialize services
    const sessionRepository = new SessionRepository();
    const questionRepository = new QuestionRepository();
    const voteRepository = new VoteRepository();
    this.sessionService = new SessionService(sessionRepository);
    this.questionService = new QuestionService(questionRepository, voteRepository);

    // Initialize rate limiters
    this.questionRateLimiter = new RateLimiterMemory({
      points: 5, // 5 questions
      duration: 60, // per minute
    });

    this.voteRateLimiter = new RateLimiterMemory({
      points: 20, // 20 votes
      duration: 60, // per minute
    });

    // Use authentication middleware
    this.io.use(authenticateSocket);

    // Initialize event handlers
    this.initializeEventHandlers();
  }

  /**
   * Initialize event handlers
   */
  private initializeEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      // Join session
      socket.on('join:session', (sessionUrl: string) => {
        this.handleJoinSession(socket, sessionUrl);
      });

      // Submit question
      socket.on('submit:question', (data: { sessionId: string; authorName: string; text: string; media?: any[] }) => {
        this.handleSubmitQuestion(socket, data);
      });

      // Submit vote
      socket.on('submit:vote', (data: { questionId: string; voterName: string; voteType: 'up' | 'down' }) => {
        this.handleSubmitVote(socket, data);
      });

      // Mark question as answered
      socket.on('mark:answered', (data: { questionId: string; sessionId: string }) => {
        this.handleMarkAnswered(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  /**
   * Handle join session event
   * @param socket Socket instance
   * @param sessionUrl Session URL
   */
  private async handleJoinSession(socket: Socket, sessionUrl: string): Promise<void> {
    try {
      // Get session by URL
      const session = await this.sessionService.getSessionByUrl(sessionUrl);

      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Join session room
      socket.join(session.id);
      console.log(`Client ${socket.id} joined session ${session.id}`);

      // Get questions for the session
      const questions = await this.questionService.getQuestionsBySessionId(session.id);

      // Send session and questions to the client
      socket.emit('session:joined', { session, questions });
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  }

  /**
   * Handle submit question event
   * @param socket Socket instance
   * @param data Question data
   */
  private async handleSubmitQuestion(
    socket: Socket,
    data: { sessionId: string; authorName: string; text: string; media?: any[] }
  ): Promise<void> {
    try {
      console.log('Received submit:question data:', data); // Add logging
      // Apply rate limiting
      try {
        await this.questionRateLimiter.consume(socket.id);
      } catch (error) {
        socket.emit('error', { message: 'Rate limit exceeded. Please try again later.' });
        return;
      }

      // Create question
      const question = await this.questionService.createQuestion(
        data.sessionId,
        data.authorName,
        data.text,
        data.media
      );

      // Broadcast new question to all clients in the session
      this.io.to(data.sessionId).emit('question:new', { question });
    } catch (error) {
      console.error('Error submitting question:', error);
      socket.emit('error', { message: 'Failed to submit question' });
    }
  }

  /**
   * Handle submit vote event
   * @param socket Socket instance
   * @param data Vote data
   */
  private async handleSubmitVote(
    socket: Socket,
    data: { questionId: string; voterName: string; voteType: 'up' | 'down' }
  ): Promise<void> {
    try {
      // Apply rate limiting
      try {
        await this.voteRateLimiter.consume(socket.id);
      } catch (error) {
        socket.emit('error', { message: 'Rate limit exceeded. Please try again later.' });
        return;
      }

      // Vote on question
      const question = await this.questionService.voteOnQuestion(
        data.questionId,
        data.voterName,
        data.voteType
      );

      if (!question) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      // Broadcast updated question to all clients in the session
      this.io.to(question.sessionId.toString()).emit('question:updated', { question });
    } catch (error) {
      console.error('Error submitting vote:', error);
      socket.emit('error', { message: 'Failed to submit vote' });
    }
  }

  /**
   * Handle mark answered event
   * @param socket Socket instance
   * @param data Mark answered data
   */
  private async handleMarkAnswered(socket: Socket, data: { questionId: string; sessionId: string }): Promise<void> {
    try {
      // Check if user is presenter
      if (!isPresenter(socket)) {
        socket.emit('error', { message: 'Unauthorized. Only presenters can mark questions as answered.' });
        return;
      }

      // Mark question as answered
      const question = await this.questionService.markQuestionAsAnswered(data.questionId);

      if (!question) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      // Broadcast updated question to all clients in the session
      this.io.to(data.sessionId).emit('question:updated', { question });
    } catch (error) {
      console.error('Error marking question as answered:', error);
      socket.emit('error', { message: 'Failed to mark question as answered' });
    }
  }

  /**
   * Get Socket.io server instance
   * @returns Socket.io server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}