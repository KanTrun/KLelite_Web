import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config';
import AppError from '../utils/AppError';
import { errorResponse } from '../utils/response';

interface DatabaseError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

interface ValidationError extends Error {
  errors?: Record<string, { message: string }>;
}

const errorHandler = (
  err: Error | AppError | DatabaseError | ValidationError,
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
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ';
  }
  // Handle Prisma known request errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    // Handle unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409;
      const meta = err.meta as { target?: string[] };
      const field = meta?.target?.[0] || 'field';
      message = `${field} đã tồn tại`;
    }
    // Handle foreign key constraint violation
    else if (err.code === 'P2003') {
      message = 'Dữ liệu liên kết không tồn tại';
    }
    // Handle record not found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Không tìm thấy dữ liệu';
    }
    else {
      message = 'Lỗi cơ sở dữ liệu';
    }
  }
  // Handle Prisma initialization errors
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 500;
    message = 'Không thể kết nối cơ sở dữ liệu';
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
