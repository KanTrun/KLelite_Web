import { PaginationQuery, PaginationInfo } from '../types';

export interface PaginationResult {
  skip: number;
  limit: number;
  page: number;
  sort: 'asc' | 'desc';
  sortField: string;
}

/**
 * Parse pagination query parameters
 * Returns Prisma-compatible format
 */
export const parsePagination = (query: PaginationQuery): PaginationResult => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '12', 10)));
  const skip = (page - 1) * limit;

  // Parse sort - Prisma expects 'asc' | 'desc' strings
  const sortField = query.sort || 'createdAt';
  const sort = query.order === 'asc' ? 'asc' : 'desc';

  return { skip, limit, page, sort, sortField };
};

/**
 * Generate pagination info
 */
export const generatePaginationInfo = (
  page: number,
  limit: number,
  total: number
): PaginationInfo => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Format price in VND
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 10): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Slugify Vietnamese string
 */
export const slugify = (str: string): string => {
  // Vietnamese characters mapping
  const from = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
  const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  
  let result = str.toLowerCase();
  
  for (let i = 0; i < from.length; i++) {
    result = result.replace(new RegExp(from[i], 'g'), to[i]);
  }
  
  return result
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
};

/**
 * Calculate shipping fee
 */
export const calculateShippingFee = (
  city: string,
  subtotal: number
): number => {
  // Free shipping for orders over 500,000 VND
  if (subtotal >= 500000) {
    return 0;
  }
  
  // Shipping fees by city
  const shippingFees: Record<string, number> = {
    'Hồ Chí Minh': 25000,
    'Hà Nội': 35000,
    'Đà Nẵng': 35000,
    default: 45000,
  };
  
  return shippingFees[city] || shippingFees.default;
};

/**
 * Validate Vietnamese phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Remove sensitive fields from user object
 */
export const sanitizeUser = (user: Record<string, unknown>): Record<string, unknown> => {
  const { password, refreshToken, verificationToken, resetPasswordToken, ...sanitized } = user;
  return sanitized;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};
