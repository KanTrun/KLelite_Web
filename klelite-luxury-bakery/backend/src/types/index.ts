import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';

// Extended Request with user
export interface AuthRequest extends Request {
  user?: User;
}

// API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
  error?: string;
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Product filters
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

// Order filters
export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

// Controller function type
export type ControllerFunction = (
  req: Request | AuthRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Error with status code
export interface HttpError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string>;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Email options
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Upload file type
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Cloudinary upload result
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

// Cart item input
export interface CartItemInput {
  productId: string;
  quantity: number;
  size?: string;
  customization?: string;
}

// Order item input
export interface OrderItemInput {
  product: string;
  quantity: number;
  price: number;
  size?: string;
  customization?: string;
}

// Address input
export interface AddressInput {
  fullName: string;
  phone: string;
  address: string;
  ward?: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

// Voucher validation result
export interface VoucherValidationResult {
  isValid: boolean;
  discount: number;
  message: string;
}
