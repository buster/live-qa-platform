import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database configuration class
 * Handles MongoDB connection
 */
class Database {
  private static instance: Database;
  private mongoURI: string;
  private isConnected: boolean = false;

  private constructor() {
    this.mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/live-qa-platform';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to MongoDB');
      return;
    }

    try {
      await mongoose.connect(this.mongoURI);
      this.isConnected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
    }
  }

  /**
   * Check if connected to MongoDB
   */
  public isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
}

export default Database;