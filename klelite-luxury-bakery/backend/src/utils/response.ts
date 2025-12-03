import { Response } from 'express';
import { ApiResponse, PaginationInfo } from '../types';

// Success response
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  pagination?: PaginationInfo
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
};

// Error response
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };
  return res.status(statusCode).json(response);
};

// Created response
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Tạo thành công'
): Response => {
  return successResponse(res, data, message, 201);
};

// No content response
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};
