import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import AppError from '../../utils/AppError';

/**
 * Validate flash sale reservation request
 */
export const validateFlashSaleReservation = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),

  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join(', ');
      return next(new AppError(errorMessages, 400));
    }
    next();
  },
];
