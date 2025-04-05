import BaseRepository from './BaseRepository';
import Session, { ISession } from '../models/Session';

/**
 * Repository for Session operations
 */
export default class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  /**
   * Find session by URL
   * @param url Session URL
   * @returns Found session or null
   */
  async findByUrl(url: string): Promise<ISession | null> {
    return this.findOne({ url });
  }

  /**
   * Create a new session with a unique URL
   * @param data Session data
   * @returns Created session
   */
  async createWithUniqueUrl(data: Partial<ISession>): Promise<ISession> {
    // Generate a unique URL if not provided
    if (!data.url) {
      data.url = this.generateUniqueUrl();
    }
    
    return this.create(data);
  }

  /**
   * End a session (set active to false)
   * @param id Session ID
   * @returns Updated session or null
   */
  async endSession(id: string): Promise<ISession | null> {
    return this.updateById(id, { active: false });
  }

  /**
   * Generate a unique URL for a session
   * @returns Unique URL
   */
  private generateUniqueUrl(): string {
    // Generate a random 6-character alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}