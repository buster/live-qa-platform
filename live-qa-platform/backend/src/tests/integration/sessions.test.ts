import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import Database from '../../config/database';
import SessionModel from '../../models/Session';
import { generatePresenterToken } from '../../middleware/auth';

// Set JWT_SECRET for tests
process.env.JWT_SECRET = 'test-secret-key';

describe('Sessions API', () => {
  let db: Database;
  
  beforeAll(async () => {
    // Connect to test database
    db = new Database();
    await db.connect();
    
    // Clear sessions collection
    await SessionModel.deleteMany({});
  });
  
  afterAll(async () => {
    // Disconnect from test database
    await db.disconnect();
  });
  
  beforeEach(async () => {
    // Clear sessions collection before each test
    await SessionModel.deleteMany({});
  });
  
  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ presenterName: 'Test Presenter' })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('presenterToken');
      expect(response.body.data.active).toBe(true);
    });
    
    it('should return 400 when presenterName is missing', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('Presenter name is required');
    });
  });
  
  describe('GET /api/sessions/:url', () => {
    it('should return a session by URL', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ presenterName: 'Test Presenter' })
        .expect(201);
      
      const { url } = createResponse.body.data;
      
      // Get the session by URL
      const response = await request(app)
        .get(`/api/sessions/${url}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.url).toBe(url);
      expect(response.body.data.active).toBe(true);
    });
    
    it('should return 404 when session is not found', async () => {
      const response = await request(app)
        .get('/api/sessions/non-existent-url')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Session not found');
    });
  });
  
  describe('DELETE /api/sessions/:id', () => {
    it('should end a session when authenticated', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ presenterName: 'Test Presenter' })
        .expect(201);
      
      const { _id, presenterToken } = createResponse.body.data;
      
      // Generate JWT token
      const token = generatePresenterToken(_id, presenterToken);
      
      // End the session
      const response = await request(app)
        .delete(`/api/sessions/${_id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data._id).toBe(_id);
      expect(response.body.data.active).toBe(false);
    });
    
    it('should return 401 when not authenticated', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ presenterName: 'Test Presenter' })
        .expect(201);
      
      const { _id } = createResponse.body.data;
      
      // Try to end the session without authentication
      const response = await request(app)
        .delete(`/api/sessions/${_id}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
    });
    
    it('should return 401 when session is not found', async () => {
      // Generate a random ID
      const id = new mongoose.Types.ObjectId().toString();
      
      // Generate JWT token with a fake presenter token
      // This will pass JWT verification but fail session validation
      const token = generatePresenterToken(id, 'fake-presenter-token');
      
      // Try to end a non-existent session
      const response = await request(app)
        .delete(`/api/sessions/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toBe('Invalid presenter token');
    });
  });
});