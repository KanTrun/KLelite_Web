import { User, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from './userService';

export interface RegisterDTO {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  googleId?: string;
  avatar?: string;
}

export interface LoginDTO {
  email: string;
  password?: string;
  googleId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

export const authService = {
  /**
   * Register new user
   */
  async register(data: RegisterDTO): Promise<{ user: User; token: string }> {
    const { password, ...userData } = data;

    // Hash password if provided
    let hashedPassword = '';
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const user = await userService.createUser({
      ...userData,
      password: hashedPassword
    });

    const token = this.generateToken(user.id);

    return { user, token };
  },

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<{ user: User; token: string }> {
    const { email, password, googleId } = data;

    const user = await userService.findUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Google Login
    if (googleId) {
      if (user.googleId !== googleId) {
        throw new Error('Invalid Google credentials');
      }
    }
    // Email/Password Login
    else {
      if (!password) {
         throw new Error('Please provide password');
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const token = this.generateToken(user.id);

    return { user, token };
  },

  /**
   * Generate JWT Token
   */
  generateToken(id: string): string {
    return jwt.sign({ id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    } as jwt.SignOptions);
  },

  /**
   * Verify Token
   */
  verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
};
