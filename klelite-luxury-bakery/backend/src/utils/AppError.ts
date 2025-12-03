import { HttpError } from '../types';

class AppError extends Error implements HttpError {
  statusCode: number;
  code?: string;
  errors?: Record<string, string>;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    errors?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factories
export const BadRequestError = (message: string = 'Yêu cầu không hợp lệ', errors?: Record<string, string>) => 
  new AppError(message, 400, 'BAD_REQUEST', errors);

export const UnauthorizedError = (message: string = 'Không có quyền truy cập') => 
  new AppError(message, 401, 'UNAUTHORIZED');

export const ForbiddenError = (message: string = 'Không có quyền thực hiện') => 
  new AppError(message, 403, 'FORBIDDEN');

export const NotFoundError = (message: string = 'Không tìm thấy') => 
  new AppError(message, 404, 'NOT_FOUND');

export const ConflictError = (message: string = 'Xung đột dữ liệu') => 
  new AppError(message, 409, 'CONFLICT');

export const ValidationError = (message: string = 'Dữ liệu không hợp lệ', errors?: Record<string, string>) => 
  new AppError(message, 422, 'VALIDATION_ERROR', errors);

export const InternalServerError = (message: string = 'Lỗi hệ thống') => 
  new AppError(message, 500, 'INTERNAL_SERVER_ERROR');

export default AppError;
