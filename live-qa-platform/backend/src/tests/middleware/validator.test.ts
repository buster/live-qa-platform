import { Request, Response, NextFunction } from 'express';
import { validateCreateSession, validateSessionParams } from '../../middleware/validator';

describe('Validator Middleware', () => {
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

  describe('validateCreateSession', () => {
    it('should call next() when presenterName is valid', () => {
      // Arrange
      mockRequest.body = { presenterName: 'Test Presenter' };
      
      // Act
      validateCreateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 when presenterName is missing', () => {
      // Arrange
      mockRequest.body = {};
      
      // Act
      validateCreateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Presenter name is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when presenterName is empty', () => {
      // Arrange
      mockRequest.body = { presenterName: '' };
      
      // Act
      validateCreateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Presenter name is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when presenterName is too long', () => {
      // Arrange
      mockRequest.body = { presenterName: 'a'.repeat(101) };
      
      // Act
      validateCreateSession(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Presenter name must be less than 100 characters',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateSessionParams', () => {
    it('should call next() when url param is valid', () => {
      // Arrange
      mockRequest.params = { url: 'valid-url' };
      
      // Act
      validateSessionParams(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 400 when url param is missing', () => {
      // Arrange
      mockRequest.params = {};
      
      // Act
      validateSessionParams(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Session URL is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 when url param is empty', () => {
      // Arrange
      mockRequest.params = { url: '' };
      
      // Act
      validateSessionParams(
        mockRequest as Request,
        mockResponse as Response,
        mockNext as NextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation Error',
        message: 'Session URL is required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});