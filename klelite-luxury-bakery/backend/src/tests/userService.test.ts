import { userService } from '../services/userService';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

// Mock the entire prisma client
jest.mock('../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
}));

const mockUser = {
  id: '1',
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

const mockAddress = {
  id: 'addr1',
  fullName: 'John Doe',
  phone: '1234567890',
  address: '123 Main St',
  ward: 'Ward A',
  district: 'District X',
  city: 'City Y',
  isDefault: true,
  userId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
      (prisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, addresses: [mockAddress] });

      const newUser = await userService.createUser({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        addresses: [{ ...mockAddress, id: undefined, userId: undefined }], // Remove id and userId for creation
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            firstName: 'Jane',
            addresses: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  fullName: 'John Doe',
                }),
              ]),
            },
          }),
          include: { addresses: true },
        })
      );
      expect(newUser).toEqual({ ...mockUser, addresses: [mockAddress] });
    });

    it('should throw an error if user with email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        userService.createUser({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('User with this email already exists');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findUserByEmail', () => {
    it('should find a user by email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, addresses: [mockAddress] });

      const user = await userService.findUserByEmail('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { addresses: true, loyaltyAccount: true },
      });
      expect(user).toEqual({ ...mockUser, addresses: [mockAddress] });
    });

    it('should return null if user not found by email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await userService.findUserByEmail('nonexistent@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        include: { addresses: true, loyaltyAccount: true },
      });
      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should find a user by ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, addresses: [mockAddress] });

      const user = await userService.findUserById('1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { addresses: true, loyaltyAccount: true },
      });
      expect(user).toEqual({ ...mockUser, addresses: [mockAddress] });
    });

    it('should return null if user not found by ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await userService.findUserById('99');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '99' },
        include: { addresses: true, loyaltyAccount: true },
      });
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updatedData = { firstName: 'Jane' };
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, ...updatedData, addresses: [mockAddress] });

      const user = await userService.updateUser('1', updatedData);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updatedData,
        include: { addresses: true },
      });
      expect(user).toEqual({ ...mockUser, ...updatedData, addresses: [mockAddress] });
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user successfully', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });

      const user = await userService.deleteUser('1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
      expect(user).toEqual({ ...mockUser, isActive: false });
    });
  });

  describe('hardDeleteUser', () => {
    it('should hard delete a user successfully', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const user = await userService.hardDeleteUser('1');
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(user).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination', async () => {
      const mockUsersList = [mockUser, { ...mockUser, id: '2', email: 'test2@example.com' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersList);
      (prisma.user.count as jest.Mock).mockResolvedValue(2);

      const result = await userService.getAllUsers(1, 10);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: expect.any(Object),
        })
      );
      expect(prisma.user.count).toHaveBeenCalledWith({});
      expect(result).toEqual({
        users: mockUsersList,
        total: 2,
        page: 1,
        pages: 1,
      });
    });

    it('should return users with search criteria', async () => {
      const mockUsersList = [{ ...mockUser, email: 'search@example.com' }];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsersList);
      (prisma.user.count as jest.Mock).mockResolvedValue(1);

      const result = await userService.getAllUsers(1, 10, 'search');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'search' } },
              { firstName: { contains: 'search' } },
              { lastName: { contains: 'search' } },
            ],
          },
        })
      );
      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'search' } },
              { firstName: { contains: 'search' } },
              { lastName: { contains: 'search' } },
            ],
          },
        })
      );
      expect(result.users).toEqual(mockUsersList);
      expect(result.total).toBe(1);
    });
  });
});
