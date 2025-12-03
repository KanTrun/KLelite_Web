import { Response, NextFunction } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import { asyncHandler, successResponse, NotFoundError, BadRequestError, ConflictError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';
import cloudinary from '../config/cloudinary';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id);
  
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
  
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  
  await user.save();
  
  successResponse(res, user, 'Cập nhật thông tin thành công');
});

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
export const updateAvatar = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id);
  
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
  
  user.avatar = result.secure_url;
  await user.save();
  
  successResponse(res, { avatar: user.avatar }, 'Cập nhật ảnh đại diện thành công');
});

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
export const addAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  const { fullName, phone, address, ward, district, city, province, isDefault } = req.body;
  
  // If this is default, unset other default addresses
  if (isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  // If this is the first address, make it default
  const makeDefault = user.addresses.length === 0 || isDefault;
  
  user.addresses.push({
    fullName,
    phone,
    address,
    ward,
    district,
    city: city || province, // Accept both city and province
    isDefault: makeDefault,
  });
  
  await user.save();
  
  successResponse(res, user.addresses, 'Thêm địa chỉ thành công');
});

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  const addressIndex = user.addresses.findIndex(
    addr => (addr as any)._id.toString() === req.params.addressId
  );
  
  if (addressIndex === -1) {
    throw NotFoundError('Không tìm thấy địa chỉ');
  }
  
  const { fullName, phone, address, ward, district, city, isDefault } = req.body;
  
  // If this is default, unset other default addresses
  if (isDefault) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  user.addresses[addressIndex] = {
    ...user.addresses[addressIndex],
    fullName: fullName || user.addresses[addressIndex].fullName,
    phone: phone || user.addresses[addressIndex].phone,
    address: address || user.addresses[addressIndex].address,
    ward: ward !== undefined ? ward : user.addresses[addressIndex].ward,
    district: district || user.addresses[addressIndex].district,
    city: city || user.addresses[addressIndex].city,
    isDefault: isDefault || user.addresses[addressIndex].isDefault,
  };
  
  await user.save();
  
  successResponse(res, user.addresses, 'Cập nhật địa chỉ thành công');
});

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  const addressIndex = user.addresses.findIndex(
    addr => (addr as any)._id.toString() === req.params.addressId
  );
  
  if (addressIndex === -1) {
    throw NotFoundError('Không tìm thấy địa chỉ');
  }
  
  const wasDefault = user.addresses[addressIndex].isDefault;
  user.addresses.splice(addressIndex, 1);
  
  // If deleted address was default, set first remaining address as default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  
  await user.save();
  
  successResponse(res, user.addresses, 'Xóa địa chỉ thành công');
});

// @desc    Get wishlist
// @route   GET /api/users/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id).populate({
    path: 'wishlist',
    select: 'name slug price comparePrice images rating numReviews isAvailable',
  });
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  successResponse(res, user.wishlist);
});

// @desc    Add to wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  // Check if already in wishlist
  if (user.wishlist.some(id => id.toString() === productId)) {
    throw ConflictError('Sản phẩm đã có trong danh sách yêu thích');
  }
  
  user.wishlist.push(product._id);
  await user.save();
  
  successResponse(res, null, 'Thêm vào danh sách yêu thích thành công');
});

// @desc    Remove from wishlist
// @route   DELETE /api/users/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;
  
  const user = await User.findById(req.user?._id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  const index = user.wishlist.findIndex(id => id.toString() === productId);
  
  if (index === -1) {
    throw NotFoundError('Sản phẩm không có trong danh sách yêu thích');
  }
  
  user.wishlist.splice(index, 1);
  await user.save();
  
  successResponse(res, null, 'Xóa khỏi danh sách yêu thích thành công');
});

// Admin controllers
// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort } = parsePagination(req.query);
  
  const filter: Record<string, unknown> = {};
  
  // Role filter
  if (req.query.role) {
    filter.role = req.query.role;
  }
  
  // Status filter
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  // Search
  if (req.query.search) {
    filter.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, users, undefined, 200, pagination);
});

// @desc    Get user by ID (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.params.id);
  
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
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (isVerified !== undefined) user.isVerified = isVerified;
  
  await user.save();
  
  successResponse(res, user, 'Cập nhật người dùng thành công');
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw NotFoundError('Không tìm thấy người dùng');
  }
  
  // Soft delete - just deactivate
  user.isActive = false;
  await user.save();
  
  successResponse(res, null, 'Xóa người dùng thành công');
});
