import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { config } from '../config';
import AppError from '../utils/AppError';
import { errorResponse } from '../utils/response';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface ValidationError extends Error {
  errors?: Record<string, { message: string }>;
}

const errorHandler = (
  err: Error | AppError | MongoError | ValidationError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Lỗi hệ thống';
  let errorDetails: string | undefined;

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.errors) {
      errorDetails = JSON.stringify(err.errors);
    }
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'ID không hợp lệ';
  }
  // Handle Mongoose ValidationError
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }
  // Handle MongoDB duplicate key error
  else if ((err as MongoError).code === 11000) {
    statusCode = 409;
    const keyValue = (err as MongoError).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'field';
    message = `${field} đã tồn tại`;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }
  // Handle Multer errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') {
      message = 'File quá lớn. Kích thước tối đa là 5MB';
    } else if ((err as { code?: string }).code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Quá nhiều file được upload';
    } else {
      message = 'Lỗi upload file';
    }
  }
  // Handle syntax errors
  else if (err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Định dạng dữ liệu không hợp lệ';
  }
  // Default error
  else {
    message = config.nodeEnv === 'development' ? err.message : 'Lỗi hệ thống';
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development' && err.stack) {
    errorDetails = err.stack;
  }

  return errorResponse(res, message, statusCode, errorDetails);
};

// Not found handler
export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Không tìm thấy: ${req.originalUrl}`, 404);
  next(error);
};

export default errorHandler;
