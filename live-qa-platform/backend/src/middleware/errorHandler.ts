import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 * @param err Error object
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default status code and error message
  const statusCode = (err as any).statusCode || 500;
  const errorMessage = (err as any).customMessage || 'Internal Server Error';
  
  // Response object
  const response: any = {
    success: false,
    error: errorMessage,
    message: err.message,
  };
  
  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(response);
};