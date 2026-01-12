import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';
import { VoucherType } from '@prisma/client';

// @desc    Validate voucher
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { code, orderTotal } = req.body;

  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      usedByUsers: {
        where: { userId: req.user!.id }
      }
    }
  });

  if (!voucher) {
    throw NotFoundError('Mã voucher không tồn tại');
  }

  // Validate voucher
  const now = new Date();
  const isActive = voucher.isActive;
  const isTimeValid = voucher.startDate <= now && (!voucher.endDate || voucher.endDate >= now);
  const isUsageLimitValid = !voucher.usageLimit || voucher.usedCount < voucher.usageLimit;
  const isMinOrderValid = orderTotal >= Number(voucher.minOrderValue);
  const userUsageCount = voucher.usedByUsers.length;
  const isUserLimitValid = !voucher.userLimit || userUsageCount < voucher.userLimit;

  if (!isActive) {
    throw BadRequestError('Mã voucher không còn hoạt động');
  }

  if (!isTimeValid) {
    throw BadRequestError('Mã voucher đã hết hạn hoặc chưa đến thời gian sử dụng');
  }

  if (!isUsageLimitValid) {
    throw BadRequestError('Mã voucher đã hết lượt sử dụng');
  }

  if (!isMinOrderValid) {
    throw BadRequestError(`Đơn hàng tối thiểu ${voucher.minOrderValue} VND`);
  }

  if (!isUserLimitValid) {
    throw BadRequestError('Bạn đã sử dụng hết lượt sử dụng voucher này');
  }

  // Calculate discount
  let discount = 0;
  if (voucher.type === VoucherType.PERCENTAGE) {
    discount = (orderTotal * Number(voucher.value)) / 100;
    if (voucher.maxDiscount) {
      discount = Math.min(discount, Number(voucher.maxDiscount));
    }
  } else if (voucher.type === VoucherType.FIXED_AMOUNT) {
    discount = Number(voucher.value);
  }

  successResponse(res, {
    code: voucher.code,
    description: voucher.description,
    type: voucher.type,
    value: voucher.value,
    discount,
    message: 'Mã voucher hợp lệ',
  });
});

// @desc    Get available vouchers for user
// @route   GET /api/vouchers/available
// @access  Private
export const getAvailableVouchers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const now = new Date();

  const vouchers = await prisma.voucher.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } }
      ]
    },
    select: {
      id: true,
      code: true,
      description: true,
      type: true,
      value: true,
      minOrderValue: true,
      maxDiscount: true,
      endDate: true,
      usedByUsers: {
        where: { userId: req.user!.id }
      },
      userLimit: true
    }
  });

  // Filter out vouchers user has exhausted their limit
  const availableVouchers = vouchers.filter(voucher => {
    const userUsageCount = voucher.usedByUsers.length;
    const userLimit = voucher.userLimit || 1;
    return userUsageCount < userLimit;
  }).map(({ usedByUsers, ...voucher }) => voucher);

  successResponse(res, availableVouchers);
});

// Admin controllers
// @desc    Get all vouchers (admin)
// @route   GET /api/vouchers
// @access  Private/Admin
export const getVouchers = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort, sortField } = parsePagination(req.query);

  const filter: any = {};

  // Status filter
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Type filter
  if (req.query.type) {
    filter.type = (req.query.type as string).toUpperCase() as VoucherType;
  }

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where: filter,
      orderBy: { [sortField]: sort },
      skip,
      take: limit,
    }),
    prisma.voucher.count({ where: filter }),
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, vouchers, undefined, 200, pagination);
});

// @desc    Get voucher by ID (admin)
// @route   GET /api/vouchers/:id
// @access  Private/Admin
export const getVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: req.params.id },
    include: {
      usedByUsers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }

  successResponse(res, voucher);
});

// @desc    Create voucher (admin)
// @route   POST /api/vouchers
// @access  Private/Admin
export const createVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await prisma.voucher.create({
    data: {
      ...req.body,
      code: req.body.code.toUpperCase()
    }
  });

  createdResponse(res, voucher, 'Tạo voucher thành công');
});

// @desc    Update voucher (admin)
// @route   PUT /api/vouchers/:id
// @access  Private/Admin
export const updateVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: req.params.id }
  });

  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }

  const updatedVoucher = await prisma.voucher.update({
    where: { id: req.params.id },
    data: req.body
  });

  successResponse(res, updatedVoucher, 'Cập nhật voucher thành công');
});

// @desc    Delete voucher (admin)
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
export const deleteVoucher = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: req.params.id }
  });

  if (!voucher) {
    throw NotFoundError('Không tìm thấy voucher');
  }

  await prisma.voucher.delete({
    where: { id: req.params.id }
  });

  successResponse(res, null, 'Xóa voucher thành công');
});
