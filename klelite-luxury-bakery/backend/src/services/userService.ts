import { User, Prisma, Role } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateUserDTO {
  email: string;
  password?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role?: Role;
  addresses?: {
    fullName: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean;
  }[];
}

export interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  role?: Role;
  isVerified?: boolean;
  verificationToken?: string;
  verificationExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshToken?: string;
  lastLogin?: Date;
}

export const userService = {
  /**
   * Create a new user
   */
  async createUser(data: CreateUserDTO): Promise<User> {
    const { addresses, ...userData } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Prepare create data
    const createData: Prisma.UserCreateInput = {
      ...userData,
      password: userData.password || '', // Password might be empty for Google auth initially? Or handle in controller.
      addresses: addresses && addresses.length > 0 ? {
        create: addresses
      } : undefined
    };

    const user = await prisma.user.create({
      data: createData,
      include: {
        addresses: true,
      },
    });

    return user;
  },

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        addresses: true,
        loyaltyAccount: true,
      },
    });
  },

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        loyaltyAccount: true,
      },
    });
  },

  /**
   * Update user details
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        addresses: true,
      },
    });
    return user;
  },

  /**
   * Soft delete user (set isActive to false)
   */
  async deleteUser(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  },

  /**
   * Hard delete user (admin only usually)
   */
  async hardDeleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  },

  /**
   * List users with pagination
   */
  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search ? {
      OR: [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
};
