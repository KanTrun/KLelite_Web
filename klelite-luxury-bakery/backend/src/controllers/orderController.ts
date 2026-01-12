import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo, calculateShippingFee } from '../utils';
import { sendEmail, emailTemplates } from '../utils/email';
import { config } from '../config';
import { AuthRequest } from '../types';
import { loyaltyService } from '../services/loyalty-service';
import * as notificationService from '../services/notificationService';
import { addEmailJob } from '../queues';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

// @desc    Create order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const {
    shippingAddress,
    paymentMethod,
    note,
    deliveryDate,
    deliveryTimeSlot,
    isGift,
    giftMessage,
    voucherCode,
    redeemPoints,
  } = req.body;

  // Get user cart
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw BadRequestError('Giỏ hàng trống');
  }

  // Validate items and calculate subtotal
  let subtotal = 0;
  const orderItems: Array<{
    productId: string;
    name: string;
    image: string | null;
    quantity: number;
    size: string | null;
    customization: any;
    price: number;
    total: number;
  }> = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product.isAvailable) {
      throw BadRequestError(`Sản phẩm "${product.name}" hiện không khả dụng`);
    }

    if (product.stock < item.quantity) {
      throw BadRequestError(`Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`);
    }

    const itemTotal = Number(item.price) * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: product.id,
      name: product.name,
      image: null, // Will need to get main image from ProductImage relation
      quantity: item.quantity,
      size: item.size,
      customization: item.customization,
      price: Number(item.price),
      total: itemTotal,
    });
  }

  // Calculate shipping fee
  const shippingFee = calculateShippingFee(shippingAddress.city, subtotal);

  // Apply voucher if provided
  let discount = 0;
  if (voucherCode) {
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode.toUpperCase() }
    });

    if (voucher) {
      // Validate voucher
      const now = new Date();
      const isTimeValid = voucher.startDate <= now && (!voucher.endDate || voucher.endDate >= now);
      const isUsageLimitValid = !voucher.usageLimit || voucher.usedCount < voucher.usageLimit;
      const isMinOrderValid = subtotal >= Number(voucher.minOrderValue);

      if (voucher.isActive && isTimeValid && isUsageLimitValid && isMinOrderValid) {
        // Calculate discount
        if (voucher.type === 'PERCENTAGE') {
          discount = (subtotal * Number(voucher.value)) / 100;
          if (voucher.maxDiscount) {
            discount = Math.min(discount, Number(voucher.maxDiscount));
          }
        } else if (voucher.type === 'FIXED_AMOUNT') {
          discount = Number(voucher.value);
        }

        // Track voucher usage
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { usedCount: { increment: 1 } }
        });

        await prisma.voucherUsage.create({
          data: {
            userId: req.user!.id,
            voucherId: voucher.id
          }
        });
      }
    }
  }

  // Calculate preliminary total (points redemption will happen after order creation)
  let pointsDiscount = 0;
  if (redeemPoints && redeemPoints > 0) {
    // Validate points before order creation
    const account = await loyaltyService.getOrCreateAccount(req.user!.id.toString());
    if (account.currentPoints < redeemPoints) {
      throw BadRequestError('Insufficient loyalty points');
    }
    pointsDiscount = redeemPoints * 10; // 1 point = 10 VND
    discount += pointsDiscount;
  }

  // Calculate total
  const total = subtotal + shippingFee - discount;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order with transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user!.id,
        shippingFullName: shippingAddress.fullName,
        shippingPhone: shippingAddress.phone,
        shippingAddress: shippingAddress.address,
        shippingWard: shippingAddress.ward,
        shippingDistrict: shippingAddress.district,
        shippingCity: shippingAddress.city,
        paymentMethod: paymentMethod.toUpperCase() as PaymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        shippingFee,
        discount,
        voucherCode: voucherCode?.toUpperCase(),
        total,
        note,
        deliveryDate,
        deliveryTimeSlot,
        isGift: isGift || false,
        giftMessage,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });

    // Update product stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          sold: { increment: item.quantity }
        }
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return newOrder;
  });

  // Redeem loyalty points AFTER order creation (atomic with real orderId)
  if (redeemPoints && redeemPoints > 0) {
    try {
      await loyaltyService.redeemPoints(
        req.user!.id.toString(),
        order.id.toString(),
        redeemPoints
      );
    } catch (error) {
      // If redemption fails, log but don't fail order (payment already processed)
      console.error('Failed to redeem loyalty points:', error);
    }
  }

  // Send confirmation email
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user) {
      const orderUrl = `${config.frontendUrl}/orders/${order.id}`;
      const emailContent = emailTemplates.orderConfirmation(user.firstName, order.orderNumber, orderUrl);
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }
  } catch {
    console.warn('Failed to send order confirmation email');
  }

  createdResponse(res, order, 'Đặt hàng thành công');
});

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort, sortField } = parsePagination(req.query);

  const filter: any = { userId: req.user!.id };

  // Status filter
  if (req.query.status) {
    filter.status = (req.query.status as string).toUpperCase() as OrderStatus;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: filter,
      orderBy: { [sortField]: sort },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.order.count({ where: filter }),
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, orders, undefined, 200, pagination);
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  // Check ownership (unless admin)
  if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  successResponse(res, order);
});

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
export const getOrderByNumber = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  // Check ownership (unless admin)
  if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  successResponse(res, order);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true
    }
  });

  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  // Check ownership
  if (order.userId !== req.user!.id) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  // Can only cancel pending or confirmed orders
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw BadRequestError('Không thể hủy đơn hàng này');
  }

  // Update order and restore stock in transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Update order
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        cancelReason: req.body.reason || 'Khách hàng yêu cầu hủy',
        cancelledAt: new Date()
      }
    });

    // Restore product stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          sold: { decrement: item.quantity }
        }
      });
    }

    return updated;
  });

  successResponse(res, updatedOrder, 'Hủy đơn hàng thành công');
});

// Admin controllers
// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort, sortField } = parsePagination(req.query);

  const filter: any = {};

  // Status filter
  if (req.query.status) {
    filter.status = (req.query.status as string).toUpperCase() as OrderStatus;
  }

  // Payment status filter
  if (req.query.paymentStatus) {
    filter.paymentStatus = (req.query.paymentStatus as string).toUpperCase() as PaymentStatus;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      filter.createdAt.gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.createdAt.lte = new Date(req.query.endDate as string);
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: filter,
      orderBy: { [sortField]: sort },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.order.count({ where: filter }),
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, orders, undefined, 200, pagination);
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { status } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: true
    }
  });

  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  // Prepare update data
  const updateData: any = {
    status: status.toUpperCase() as OrderStatus
  };

  // Set delivered date
  if (status.toUpperCase() === 'DELIVERED') {
    updateData.deliveredAt = new Date();
    // Auto update payment status for COD
    if (order.paymentMethod === PaymentMethod.COD) {
      updateData.paymentStatus = PaymentStatus.PAID;
      updateData.paidAt = new Date();
    }
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData
  });

  // Track purchase activity for recommendations
  if (status.toUpperCase() === 'DELIVERED') {
    try {
      const purchaseActivities = order.items.map((item: any) => ({
        userId: order.userId,
        productId: item.productId,
        activityType: 'PURCHASE' as any,
        metadata: {
          quantity: item.quantity,
          price: Number(item.price)
        }
      }));

      await prisma.userActivity.createMany({
        data: purchaseActivities
      });

      console.log(`Tracked ${purchaseActivities.length} purchase activities for order ${order.orderNumber}`);
    } catch (error) {
      console.warn('Failed to track purchase activity:', error);
    }

    // Award loyalty points
    try {
      const pointsEarned = await loyaltyService.earnPoints(
        order.userId.toString(),
        order.id.toString(),
        Number(order.total)
      );
      console.log(`User ${order.userId} earned ${pointsEarned} loyalty points from order ${order.orderNumber}`);
    } catch (error) {
      console.warn('Failed to award loyalty points:', error);
    }
  }

  // Send notification to user about order status update
  try {
    const statusMessages: Record<string, string> = {
      PENDING: 'Đơn hàng của bạn đang chờ xác nhận',
      CONFIRMED: 'Đơn hàng của bạn đã được xác nhận',
      PROCESSING: 'Đơn hàng của bạn đang được chuẩn bị',
      SHIPPING: 'Đơn hàng của bạn đang được giao',
      DELIVERED: 'Đơn hàng của bạn đã được giao thành công',
      CANCELLED: 'Đơn hàng của bạn đã bị hủy'
    };

    await notificationService.create(order.userId.toString(), {
      type: 'ORDER_STATUS',
      title: 'Cập nhật trạng thái đơn hàng',
      message: statusMessages[status.toUpperCase()] || `Trạng thái đơn hàng: ${status}`,
      data: {
        orderId: order.id,
        url: `/orders/${order.id}`
      }
    });

    // Queue email notification
    if (order.user) {
      await addEmailJob({
        to: order.user.email,
        subject: `Đơn hàng #${order.orderNumber} - ${status}`,
        template: 'orderStatusUpdate',
        data: {
          customerName: order.user.firstName || order.user.email,
          orderNumber: order.orderNumber,
          status: statusMessages[status.toUpperCase()] || status
        }
      });
    }
  } catch (error) {
    console.warn('Failed to send order status notification:', error);
  }

  successResponse(res, updatedOrder, 'Cập nhật trạng thái đơn hàng thành công');
});

// @desc    Update payment status (admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { status, transactionId } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }

  const updateData: any = {
    paymentStatus: status.toUpperCase() as PaymentStatus
  };

  if (transactionId) {
    updateData.transactionId = transactionId;
  }

  if (status.toUpperCase() === 'PAID') {
    updateData.paidAt = new Date();
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: updateData
  });

  successResponse(res, updatedOrder, 'Cập nhật trạng thái thanh toán thành công');
});

// @desc    Get order statistics (admin)
// @route   GET /api/orders/admin/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders,
    todayOrders,
    monthOrders,
    paidOrders,
    paidMonthOrders,
    pendingOrders,
    processingOrders,
    ordersByStatus,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.order.findMany({
      where: {
        status: { not: OrderStatus.CANCELLED },
        paymentStatus: PaymentStatus.PAID
      },
      select: { total: true }
    }),
    prisma.order.findMany({
      where: {
        status: { not: OrderStatus.CANCELLED },
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: thisMonth }
      },
      select: { total: true }
    }),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({
      where: {
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPING]
        }
      }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
  ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const monthRevenue = paidMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const statusMap: Record<string, number> = {};
  ordersByStatus.forEach(item => {
    statusMap[item.status] = item._count.status;
  });

  successResponse(res, {
    totalOrders,
    todayOrders,
    monthOrders,
    totalRevenue,
    monthRevenue,
    pendingOrders,
    processingOrders,
    ordersByStatus: statusMap,
  });
});

// @desc    Get recent orders (admin)
// @route   GET /api/orders/admin/recent
// @access  Private/Admin
export const getRecentOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 5;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  successResponse(res, orders);
});
