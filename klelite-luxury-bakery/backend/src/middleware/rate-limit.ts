import rateLimitLib from 'express-rate-limit';

/**
 * Rate limiting middleware factory
 * Prevents API abuse by limiting request frequency per IP
 */
export const rateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimitLib({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};
