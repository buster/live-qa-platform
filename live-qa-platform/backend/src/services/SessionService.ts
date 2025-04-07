import { v4 as uuidv4 } from 'uuid';
import SessionRepository from '../repositories/SessionRepository';
import { ISession } from '../models/Session';

/**
 * Interface for session creation parameters
 */
interface CreateSessionParams {
  presenterName: string;
  customCode?: string;
}

/**
 * Service for managing sessions
 */
export default class SessionService {
  private sessionRepository: SessionRepository;

  /**
   * Create a new SessionService
   * @param sessionRepository Repository for session operations
   */
  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  /**
   * Create a new session
   * @param params Session creation parameters
   * @returns Created session
   */
  async createSession(params: CreateSessionParams | string): Promise<ISession> {
    // Handle both string and object parameters for backward compatibility
    const presenterName = typeof params === 'string' ? params : params.presenterName;
    const customCode = typeof params === 'string' ? undefined : params.customCode;
    
    // Generate a unique token for the presenter
    const presenterToken = this.generateToken();

    // Create a new session
    const session = await this.sessionRepository.createWithUniqueUrl({
      presenterName,
      presenterToken,
      url: customCode,
    });

    return session;
  }

  /**
   * Get a session by URL
   * @param url Session URL
   * @returns Found session or null
   */
  async getSessionByUrl(url: string): Promise<ISession | null> {
    return this.sessionRepository.findByUrl(url);
  }

  /**
   * End a session
   * @param id Session ID
   * @returns Updated session or null
   */
  async endSession(id: string): Promise<ISession | null> {
    return this.sessionRepository.endSession(id);
  }

  /**
   * Validate a presenter token for a session
   * @param sessionId Session ID
   * @param token Presenter token
   * @returns True if the token is valid, false otherwise
   */
  async validatePresenterToken(sessionId: string, token: string): Promise<boolean> {
    const session = await this.sessionRepository.findById(sessionId);
    return session !== null && session.presenterToken === token;
  }

  /**
   * Generate a unique token
   * @returns Unique token
   */
  private generateToken(): string {
    return uuidv4();
  }
}