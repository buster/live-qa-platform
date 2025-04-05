import { Request, Response } from 'express';
import SessionController from '../../controllers/SessionController';
import SessionService from '../../services/SessionService';

// Mock the SessionService
jest.mock('../../services/SessionService');

describe('SessionController', () => {
  let sessionController: SessionController;
  let mockSessionService: jest.Mocked<SessionService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock SessionService
    mockSessionService = new SessionService(null as any) as jest.Mocked<SessionService>;
    
    // Create a new SessionController with the mock service
    sessionController = new SessionController(mockSessionService);
    
    // Create mock request, response, and next function
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('createSession', () => {
    it('should create a session and return 201 status with the session data', async () => {
      // Arrange
      const presenterName = 'Test Presenter';
      mockRequest.body = { presenterName };
      
      const mockSession = {
        id: 'test-id',
        url: 'test-url',
        presenterToken: 'test-token',
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionService.createSession.mockResolvedValue(mockSession as any);
      
      // Act
      await sessionController.createSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.createSession).toHaveBeenCalledWith(presenterName);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should call next with an error if the service throws an error', async () => {
      // Arrange
      const presenterName = 'Test Presenter';
      mockRequest.body = { presenterName };
      
      const error = new Error('Service error');
      mockSessionService.createSession.mockRejectedValue(error);
      
      // Act
      await sessionController.createSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.createSession).toHaveBeenCalledWith(presenterName);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getSessionByUrl', () => {
    it('should return 200 status with the session data when found', async () => {
      // Arrange
      const url = 'test-url';
      mockRequest.params = { url };
      
      const mockSession = {
        id: 'test-id',
        url,
        presenterToken: 'test-token',
        active: true,
        createdAt: new Date(),
      };
      
      mockSessionService.getSessionByUrl.mockResolvedValue(mockSession as any);
      
      // Act
      await sessionController.getSessionByUrl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.getSessionByUrl).toHaveBeenCalledWith(url);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should return 404 status when session is not found', async () => {
      // Arrange
      const url = 'non-existent-url';
      mockRequest.params = { url };
      
      mockSessionService.getSessionByUrl.mockResolvedValue(null);
      
      // Act
      await sessionController.getSessionByUrl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.getSessionByUrl).toHaveBeenCalledWith(url);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should call next with an error if the service throws an error', async () => {
      // Arrange
      const url = 'test-url';
      mockRequest.params = { url };
      
      const error = new Error('Service error');
      mockSessionService.getSessionByUrl.mockRejectedValue(error);
      
      // Act
      await sessionController.getSessionByUrl(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.getSessionByUrl).toHaveBeenCalledWith(url);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('endSession', () => {
    it('should return 200 status with the updated session data when found', async () => {
      // Arrange
      const id = 'test-id';
      mockRequest.params = { id };
      
      const mockSession = {
        id,
        url: 'test-url',
        presenterToken: 'test-token',
        active: false,
        createdAt: new Date(),
      };
      
      mockSessionService.endSession.mockResolvedValue(mockSession as any);
      
      // Act
      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.endSession).toHaveBeenCalledWith(id);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession,
      });
    });

    it('should return 404 status when session is not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      mockRequest.params = { id };
      
      mockSessionService.endSession.mockResolvedValue(null);
      
      // Act
      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.endSession).toHaveBeenCalledWith(id);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Session not found',
      });
    });

    it('should call next with an error if the service throws an error', async () => {
      // Arrange
      const id = 'test-id';
      mockRequest.params = { id };
      
      const error = new Error('Service error');
      mockSessionService.endSession.mockRejectedValue(error);
      
      // Act
      await sessionController.endSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      // Assert
      expect(mockSessionService.endSession).toHaveBeenCalledWith(id);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});