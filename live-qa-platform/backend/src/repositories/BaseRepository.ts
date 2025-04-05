import mongoose, { Document, Model } from 'mongoose';

/**
 * Base repository class for CRUD operations
 */
export default abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  /**
   * Create a new document
   * @param data Document data
   * @returns Created document
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  /**
   * Find document by ID
   * @param id Document ID
   * @returns Found document or null
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  /**
   * Find documents by filter
   * @param filter Filter criteria
   * @returns Array of found documents
   */
  async find(filter: object = {}): Promise<T[]> {
    return this.model.find(filter);
  }

  /**
   * Find one document by filter
   * @param filter Filter criteria
   * @returns Found document or null
   */
  async findOne(filter: object): Promise<T | null> {
    return this.model.findOne(filter);
  }

  /**
   * Update document by ID
   * @param id Document ID
   * @param data Update data
   * @returns Updated document or null
   */
  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Delete document by ID
   * @param id Document ID
   * @returns Deleted document or null
   */
  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id);
  }

  /**
   * Count documents by filter
   * @param filter Filter criteria
   * @returns Count of documents
   */
  async count(filter: object = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }
}