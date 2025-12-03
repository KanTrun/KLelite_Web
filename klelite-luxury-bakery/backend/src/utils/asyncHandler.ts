import { Request, Response, NextFunction } from 'express';
import { ControllerFunction } from '../types';

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn: ControllerFunction) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
