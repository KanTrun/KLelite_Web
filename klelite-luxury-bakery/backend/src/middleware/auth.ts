import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils';
import { JwtPayload, AuthRequest } from '../types';

// Protect routes - require authentication
export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // Make sure token exists
    if (!token) {
      throw UnauthorizedError('Vui lòng đăng nhập để truy cập');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      throw UnauthorizedError('Người dùng không tồn tại');
    }

    // Check if user is active
    if (!user.isActive) {
      throw UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(UnauthorizedError('Token không hợp lệ'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(UnauthorizedError('Token đã hết hạn'));
    } else {
      next(error);
    }
  }
};

// Optional authentication - attach user if logged in
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Continue without user if token is invalid
    next();
  }
};

// Restrict to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(UnauthorizedError('Vui lòng đăng nhập để truy cập'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ForbiddenError('Bạn không có quyền thực hiện hành động này')
      );
    }

    next();
  };
};

// Check if user owns resource or is admin
export const authorizeOwnerOrAdmin = (
  getResourceOwnerId: (req: Request) => Promise<string | null>
) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw UnauthorizedError('Vui lòng đăng nhập để truy cập');
      }

      // Admin can access everything
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Get resource owner ID
      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        throw ForbiddenError('Không có quyền truy cập tài nguyên này');
      }

      // Check if user owns the resource
      if (req.user.id !== ownerId) {
        throw ForbiddenError('Không có quyền truy cập tài nguyên này');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
