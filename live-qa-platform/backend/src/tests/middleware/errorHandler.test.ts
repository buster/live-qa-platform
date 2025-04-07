import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should handle general errors with 500 status code', () => {
    // Arrange
    const error = new Error('Test error');
    
    // Act
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Test error',
    });
  });

  it('should handle custom errors with custom status code', () => {
    // Arrange
    const error: any = new Error('Custom error');
    error.statusCode = 400;
    error.customMessage = 'Bad Request';
    
    // Act
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Bad Request',
      message: 'Custom error',
    });
  });

  it('should include stack trace in development environment', () => {
    // Arrange
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error');
    error.stack = 'Test stack trace';
    
    // Act
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    
    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
      message: 'Test error',
      stack: 'Test stack trace',
    });
    
    // Cleanup
    process.env.NODE_ENV = originalEnv;
  });
});