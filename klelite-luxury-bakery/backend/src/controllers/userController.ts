import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, NotFoundError, BadRequestError, ConflictError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';
import { Role } from '@prisma/client';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      addresses: true
    }
  });

  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }

  successResponse(res, user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { firstName, lastName, phone } = req.body;

  const updateData: any = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone) updateData.phone = phone;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData
  });

  successResponse(res, user, 'Cập nhật thông tin thành công');
});

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
export const updateAvatar = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }

  if (!req.file) {
    throw BadRequestError('Vui lòng chọn ảnh để upload');
  }

  // Delete old avatar from cloudinary if exists
  if (user.avatar) {
    const publicId = user.avatar.split('/').pop()?.split('.')[0];
    if (publicId) {
      await cloudinary.uploader.destroy(`klelite/avatars/${publicId}`);
    }
  }

  // Upload new avatar
  const result = await cloudinary.uploader.upload(
    `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
    {
      folder: 'klelite/avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    }
  );

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { avatar: result.secure_url }
  });

  successResponse(res, { avatar: updatedUser.avatar }, 'Cập nhật ảnh đại diện thành công');
});

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { fullName, phone, address, ward, district, city, province, isDefault } = req.body;

  // If this is default, unset other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.id, isDefault: true },
      data: { isDefault: false }
    });
  }

  // Check if this is the first address
  const addressCount = await prisma.address.count({
    where: { userId: req.user!.id }
  });

  const newAddress = await prisma.address.create({
    data: {
      userId: req.user!.id,
      fullName,
      phone,
      address,
      ward,
      district,
      city: city || province, // Accept both city and province
      isDefault: addressCount === 0 || isDefault
    }
  });

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id }
  });

  successResponse(res, addresses, 'Thêm địa chỉ thành công');
});

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { fullName, phone, address, ward, district, city, isDefault } = req.body;

  const existingAddress = await prisma.address.findFirst({
    where: {
      id: req.params.addressId,
      userId: req.user!.id
    }
  });

  if (!existingAddress) {
    throw NotFoundError('Không tìm thấy địa chỉ');
  }

  // If this is default, unset other default addresses
  if (isDefault) {
    await prisma.address.updateMany({
      where: {
        userId: req.user!.id,
        isDefault: true,
        id: { not: req.params.addressId }
      },
      data: { isDefault: false }
    });
  }

  const updateData: any = {};
  if (fullName) updateData.fullName = fullName;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (ward !== undefined) updateData.ward = ward;
  if (district) updateData.district = district;
  if (city) updateData.city = city;
  if (isDefault !== undefined) updateData.isDefault = isDefault;

  await prisma.address.update({
    where: { id: req.params.addressId },
    data: updateData
  });

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id }
  });

  successResponse(res, addresses, 'Cập nhật địa chỉ thành công');
});

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const address = await prisma.address.findFirst({
    where: {
      id: req.params.addressId,
      userId: req.user!.id
    }
  });

  if (!address) {
    throw NotFoundError('Không tìm thấy địa chỉ');
  }

  const wasDefault = address.isDefault;

  await prisma.address.delete({
    where: { id: req.params.addressId }
  });

  // If deleted address was default, set first remaining address as default
  if (wasDefault) {
    const firstAddress = await prisma.address.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' }
    });

    if (firstAddress) {
      await prisma.address.update({
        where: { id: firstAddress.id },
        data: { isDefault: true }
      });
    }
  }

  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id }
  });

  successResponse(res, addresses, 'Xóa địa chỉ thành công');
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      wishlist: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          rating: true,
          numReviews: true,
          isAvailable: true,
          stock: true,
          images: {
            where: { isMain: true },
            take: 1
          }
        }
      }
    }
  });

  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }

  // Transform wishlist to match expected format
  const wishlistItems = user.wishlist.map((product: any) => ({
    _id: product.id,
    product: {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      images: product.images.map((img: any) => img.url),
      mainImage: product.images[0]?.url,
      rating: product.rating,
      numReviews: product.numReviews,
      stock: product.stock || 0,
      isAvailable: product.isAvailable
    },
    addedAt: new Date().toISOString()
  }));

  successResponse(res, wishlistItems);
});

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Check if already in wishlist
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      wishlist: {
        where: { id: productId }
      }
    }
  });

  if (user && user.wishlist.length > 0) {
    throw ConflictError('Sản phẩm đã có trong danh sách yêu thích');
  }

  // Add to wishlist
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      wishlist: {
        connect: { id: productId }
      }
    }
  });

  successResponse(res, null, 'Thêm vào danh sách yêu thích thành công');
});

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;

  // Check if in wishlist
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      wishlist: {
        where: { id: productId }
      }
    }
  });

  if (!user || user.wishlist.length === 0) {
    throw NotFoundError('Sản phẩm không có trong danh sách yêu thích');
  }

  // Remove from wishlist
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      wishlist: {
        disconnect: { id: productId }
      }
    }
  });

  successResponse(res, null, 'Xóa khỏi danh sách yêu thích thành công');
});

// Admin controllers
// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort, sortField } = parsePagination(req.query);

  const filter: any = {};

  // Role filter
  if (req.query.role) {
    filter.role = (req.query.role as string).toUpperCase() as Role;
  }

  // Status filter
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Search
  if (req.query.search) {
    const searchTerm = req.query.search as string;
    filter.OR = [
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { firstName: { contains: searchTerm, mode: 'insensitive' } },
      { lastName: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: filter,
      orderBy: { [sortField]: sort },
      skip,
      take: limit,
    }),
    prisma.user.count({ where: filter }),
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, users, undefined, 200, pagination);
});

// @desc    Get user by ID (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      addresses: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }

  successResponse(res, user);
});

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { role, isActive, isVerified } = req.body;

  if (role && !Object.values(Role).includes(role.toUpperCase() as Role)) {
    throw BadRequestError('Role không hợp lệ. Các role hợp lệ: ' + Object.values(Role).join(', '));
  }

  const updateData: any = {};
  if (role) {
    updateData.role = role.toUpperCase() as Role;
  }
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isVerified !== undefined) updateData.isVerified = isVerified;

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData
  });

  successResponse(res, user, 'Cập nhật người dùng thành công');
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id }
  });

  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }

  // Soft delete - just deactivate
  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false }
  });

  successResponse(res, null, 'Xóa người dùng thành công');
});
