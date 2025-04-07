import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticatePresenter } from '../../middleware/auth';
import SessionService from '../../services/SessionService';

// Mock the SessionService and jsonwebtoken
jest.mock('../../services/SessionService');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockSessionService: jest.Mocked<SessionService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockRequest = {
      headers: {},
      params: { id: 'test-session-id' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    mockSessionService = new SessionService(null as any) as jest.Mocked<SessionService>;
    
    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    // Clean up
    delete process.env.JWT_SECRET;
  });

  it('should call next() when token is valid', async () => {
    // Arrange
    const token = 'valid-token';
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    const decodedToken = { sessionId: 'test-session-id', presenterToken: 'test-presenter-token' };
    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    
    mockSessionService.validatePresenterToken.mockResolvedValue(true);
    
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    expect(mockSessionService.validatePresenterToken).toHaveBeenCalledWith(
      'test-session-id',
      'test-presenter-token'
    );
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should return 401 when no token is provided', async () => {
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'No token provided',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token format is invalid', async () => {
    // Arrange
    mockRequest.headers = { authorization: 'InvalidFormat token' };
    
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token format',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification fails', async () => {
    // Arrange
    const token = 'invalid-token';
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when presenter token validation fails', async () => {
    // Arrange
    const token = 'valid-token';
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    const decodedToken = { sessionId: 'test-session-id', presenterToken: 'test-presenter-token' };
    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    
    mockSessionService.validatePresenterToken.mockResolvedValue(false);
    
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    expect(mockSessionService.validatePresenterToken).toHaveBeenCalledWith(
      'test-session-id',
      'test-presenter-token'
    );
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid presenter token',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 500 when an unexpected error occurs', async () => {
    // Arrange
    const token = 'valid-token';
    mockRequest.headers = { authorization: `Bearer ${token}` };
    
    const decodedToken = { sessionId: 'test-session-id', presenterToken: 'test-presenter-token' };
    (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
    
    const error = new Error('Unexpected error');
    mockSessionService.validatePresenterToken.mockRejectedValue(error);
    
    // Act
    await authenticatePresenter(mockSessionService)(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});