import { Request, Response, NextFunction } from 'express';

/**
 * Validates the request body for creating a session
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const validateCreateSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { presenterName, customCode } = req.body;
  
  // Check if presenterName exists
  if (!presenterName) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Presenter name is required',
    });
    return;
  }
  
  // Check if presenterName is not empty
  if (presenterName.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Presenter name is required',
    });
    return;
  }
  
  // Check if presenterName is not too long
  if (presenterName.length > 100) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Presenter name must be less than 100 characters',
    });
    return;
  }
  
  // Validate customCode if provided
  if (customCode !== undefined) {
    // Check if customCode is a string
    if (typeof customCode !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Custom code must be a string',
      });
      return;
    }
    
    // Check if customCode is 6 characters long and alphanumeric
    if (!/^[A-Za-z0-9]{6}$/.test(customCode)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Custom code must be 6 alphanumeric characters',
      });
      return;
    }
  }
  
  next();
};

/**
 * Validates the request parameters for session operations
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export const validateSessionParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { url } = req.params;
  
  // Check if url exists
  if (!url) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Session URL is required',
    });
    return;
  }
  
  // Check if url is not empty
  if (url.trim() === '') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Session URL is required',
    });
    return;
  }
  
  next();
};