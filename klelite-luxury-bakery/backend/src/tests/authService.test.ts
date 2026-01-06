import { authService, RegisterDTO, LoginDTO } from '../services/authService';
import { userService } from '../services/userService';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';

// Mock external modules
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../lib/prisma', () => ({
  user: {
    update: jest.fn(),
  },
}));
jest.mock('../services/userService', () => ({
  userService: {
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
  },
}));

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  password: 'hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  phone: '1234567890',
  avatar: null,
  role: Role.USER,
  isActive: true,
  isVerified: true,
  verificationToken: null,
  verificationExpire: null,
  resetPasswordToken: null,
  resetPasswordExpire: null,
  refreshToken: null,
  lastLogin: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRE = '1h';
  });

  describe('register', () => {
    it('should register a new user and return user and token', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (userService.createUser as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const registerData: RegisterDTO = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      const result = await authService.register(registerData);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'hashedpassword',
        })
      );
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, 'test_secret', { expiresIn: '1h' });
      expect(result).toEqual({ user: mockUser, token: 'mockToken' });
    });

    it('should register a new user without password (e.g., social login)', async () => {
      (userService.createUser as jest.Mock).mockResolvedValue({ ...mockUser, password: '' });
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const registerData: RegisterDTO = {
        email: 'social@example.com',
        firstName: 'Social',
        lastName: 'User',
        googleId: 'google123',
      };

      const result = await authService.register(registerData);

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'social@example.com',
          googleId: 'google123',
          password: '', // Password will be empty if not provided
        })
      );
      expect(result).toEqual({ user: { ...mockUser, password: '' }, token: 'mockToken' });
    });
  });

  describe('login', () => {
    it('should login a user with email and password and return user and token', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const loginData: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginData);

      expect(userService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { lastLogin: expect.any(Date) },
        })
      );
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, 'test_secret', { expiresIn: '1h' });
      expect(result).toEqual({ user: mockUser, token: 'mockToken' });
    });

    it('should login a user with googleId', async () => {
      const googleUser = { ...mockUser, googleId: 'google123', password: '' };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(googleUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(googleUser);
      (jwt.sign as jest.Mock).mockReturnValue('mockToken');

      const loginData: LoginDTO = {
        email: 'test@example.com',
        googleId: 'google123',
      };

      const result = await authService.login(loginData);

      expect(userService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Should not call bcrypt for google login
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: googleUser.id },
          data: { lastLogin: expect.any(Date) },
        })
      );
      expect(result).toEqual({ user: googleUser, token: 'mockToken' });
    });

    it('should throw error if user not found', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);

      const loginData: LoginDTO = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user account is deactivated', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      const loginData: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginData)).rejects.toThrow('User account is deactivated');
    });

    it('should throw error for invalid password', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const loginData: LoginDTO = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid googleId', async () => {
      const googleUser = { ...mockUser, googleId: 'wrong_google_id' };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(googleUser);

      const loginData: LoginDTO = {
        email: 'test@example.com',
        googleId: 'google123',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid Google credentials');
    });

    it('should throw error if no password for email/password login', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      const loginData: LoginDTO = {
        email: 'test@example.com',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Please provide password');
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      (jwt.sign as jest.Mock).mockReturnValue('generatedToken');
      const token = authService.generateToken('user1');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user1' }, 'test_secret', { expiresIn: '1h' });
      expect(token).toBe('generatedToken');
    });
  });

  describe('verifyToken', () => {
    it('should verify a JWT token', () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user1' });
      const decoded = authService.verifyToken('validToken');
      expect(jwt.verify).toHaveBeenCalledWith('validToken', 'test_secret');
      expect(decoded).toEqual({ id: 'user1' });
    });
  });
});
