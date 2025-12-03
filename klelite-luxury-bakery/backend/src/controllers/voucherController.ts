import { Response, NextFunction } from 'express';
import Voucher from '../models/Voucher';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';

// @desc    Validate voucher
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { code, orderTotal } = req.body;
  
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });
  
  if (!voucher) {
    throw NotFoundError('Mã voucher không tồn tại');
  }
  
  const validation = (voucher as any).isValid(req.user?._id.toString(), orderTotal);
  
  if (!validation.valid) {
    throw BadRequestError(validation.message);
  }
  
  const discount = (voucher as any).calculateDiscount(orderTotal);
  
  successResponse(res, {
    code: voucher.code,
    description: voucher.description,
    type: voucher.type,
    value: voucher.value,
    discount,
    message: validation.message,
  });
});

// @desc    Get available vouchers for user
// @route   GET /api/vouchers/available
// @access  Private
export const getAvailableVouchers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const now = new Date();
  
  const vouchers = await Voucher.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: -1 },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
    ],
  }).select('code description type value minOrderValue maxDiscount endDate usedByUsers userLimit');
  
  // Filter out vouchers user has exhausted their limit
  const availableVouchers = vouchers.filter(voucher => {
    const usedByUsers = voucher.usedByUsers || [];
    const userUsageCount = usedByUsers.filter(
      id => id.toString() === req.user?._id.toString()
    ).length;
    const userLimit = voucher.userLimit || 1;
    return userUsageCount < userLimit;
  });
  
  successResponse(res, availableVouchers);
});

// Admin controllers
// @desc    Get all vouchers (admin)
// @route   GET /api/vouchers
// @access  Private/Admin
export const getVouchers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort } = parsePagination(req.query);
  
  const filter: Record<string, unknown> = {};
  
  // Status filter
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  // Type filter
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  const [vouchers, total] = await Promise.all([
    Voucher.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Voucher.countDocuments(filter),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, vouchers, undefined, 200, pagination);
});

// @desc    Get voucher by ID (admin)
// @route   GET /api/vouchers/:id
// @access  Private/Admin
export const getVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }
  
  successResponse(res, voucher);
});

// @desc    Create voucher (admin)
// @route   POST /api/vouchers
// @access  Private/Admin
export const createVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await Voucher.create(req.body);
  
  createdResponse(res, voucher, 'Tạo voucher thành công');
});

// @desc    Update voucher (admin)
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
export const updateVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }
  
  voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  successResponse(res, voucher, 'Cập nhật voucher thành công');
});

// @desc    Delete voucher (admin)
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
export const deleteVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await Voucher.findById(req.params.id);
  
  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }
  
  await voucher.deleteOne();
  
  successResponse(res, null, 'Xóa voucher thành công');
});
