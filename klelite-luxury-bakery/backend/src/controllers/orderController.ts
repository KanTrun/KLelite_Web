import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import Voucher from '../models/Voucher';
import User from '../models/User';
import UserActivity from '../models/UserActivity';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo, calculateShippingFee } from '../utils';
import { sendEmail, emailTemplates } from '../utils/email';
import { config } from '../config';
import { AuthRequest } from '../types';
import { loyaltyService } from '../services/loyalty-service';
import * as notificationService from '../services/notificationService';
import { addEmailJob } from '../queues';

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
  const cart = await Cart.findOne({ user: req.user?._id }).populate('items.product');
  
  if (!cart || cart.items.length === 0) {
    throw BadRequestError('Giỏ hàng trống');
  }

  // Validate items and calculate subtotal
  let subtotal = 0;
  const orderItems = [];

  // Batch fetch all products at once
  // Handle both populated and non-populated product references
  const productIds = cart.items.map(item => {
    // If product is already populated (has _id property), use _id, otherwise use the product reference directly
    return typeof item.product === 'object' && item.product._id ? item.product._id : item.product;
  });
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of cart.items) {
    // Extract the product ID correctly whether populated or not
    const productId = typeof item.product === 'object' && item.product._id
      ? item.product._id.toString()
      : item.product.toString();

    const product = productMap.get(productId);
    if (!product) {
      throw BadRequestError(`Sản phẩm không tồn tại`);
    }

    if (!product.isAvailable) {
      throw BadRequestError(`Sản phẩm "${product.name}" hiện không khả dụng`);
    }

    if (product.stock < item.quantity) {
      throw BadRequestError(`Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho`);
    }

    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.mainImage,
      quantity: item.quantity,
      size: item.size,
      customization: item.customization,
      price: item.price,
      total: itemTotal,
    });
  }
  
  // Calculate shipping fee
  const shippingFee = calculateShippingFee(shippingAddress.city, subtotal);
  
  // Apply voucher if provided
  let discount = 0;
  if (voucherCode) {
    const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
    if (voucher) {
      const validation = (voucher as any).isValid(req.user?._id.toString(), subtotal);
      if (validation.valid) {
        discount = (voucher as any).calculateDiscount(subtotal);
        // Track voucher usage
        voucher.usedCount += 1;
        voucher.usedByUsers.push(req.user!._id);
        await voucher.save();
      }
    }
  }

  // Calculate preliminary total (points redemption will happen after order creation)
  let pointsDiscount = 0;
  if (redeemPoints && redeemPoints > 0) {
    // Validate points before order creation
    const account = await loyaltyService.getOrCreateAccount(req.user!._id.toString());
    if (account.currentPoints < redeemPoints) {
      throw BadRequestError('Insufficient loyalty points');
    }
    pointsDiscount = redeemPoints * 10; // 1 point = 10 VND
    discount += pointsDiscount;
  }

  // Calculate total
  const total = subtotal + shippingFee - discount;

  // Create order
  const order = await Order.create({
    user: req.user?._id,
    items: orderItems,
    shippingAddress,
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'pending',
    },
    subtotal,
    shippingFee,
    discount,
    voucherCode: voucherCode?.toUpperCase(),
    total,
    note,
    deliveryDate,
    deliveryTimeSlot,
    isGift,
    giftMessage,
  });

  // Redeem loyalty points AFTER order creation (atomic with real orderId)
  if (redeemPoints && redeemPoints > 0) {
    try {
      await loyaltyService.redeemPoints(
        req.user!._id.toString(),
        order._id.toString(),
        redeemPoints
      );
    } catch (error) {
      // If redemption fails, log but don't fail order (payment already processed)
      console.error('Failed to redeem loyalty points:', error);
    }
  }
  
  // Update product stock and sold count
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }
  
  // Clear cart
  cart.items = [];
  await cart.save();
  
  // Send confirmation email
  try {
    const user = await User.findById(req.user?._id);
    if (user) {
      const orderUrl = `${config.frontendUrl}/orders/${order._id}`;
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
  const { skip, limit, page, sort } = parsePagination(req.query);
  
  const filter: Record<string, unknown> = { user: req.user?._id };
  
  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, orders, undefined, 200, pagination);
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  // Check ownership (unless admin)
  if (order.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  successResponse(res, order);
});

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
export const getOrderByNumber = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  
  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  // Check ownership (unless admin)
  if (order.user.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  successResponse(res, order);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user?._id.toString()) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  // Can only cancel pending or confirmed orders
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw BadRequestError('Không thể hủy đơn hàng này');
  }
  
  // Update order
  order.status = 'cancelled';
  order.cancelReason = req.body.reason || 'Khách hàng yêu cầu hủy';
  order.cancelledAt = new Date();
  
  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
    });
  }
  
  await order.save();
  
  successResponse(res, order, 'Hủy đơn hàng thành công');
});

// Admin controllers
// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort } = parsePagination(req.query);
  
  const filter: Record<string, unknown> = {};
  
  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  // Payment status filter
  if (req.query.paymentStatus) {
    filter['payment.status'] = req.query.paymentStatus;
  }
  
  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {};
    if (req.query.startDate) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      (filter.createdAt as Record<string, Date>).$lte = new Date(req.query.endDate as string);
    }
  }
  
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, orders, undefined, 200, pagination);
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { status } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  // Update status
  order.status = status;

  // Set delivered date
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    // Auto update payment status for COD
    if (order.payment.method === 'cod') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
    }

    // Track purchase activity for recommendations
    try {
      await order.populate('items.product');
      const purchaseActivities = order.items.map((item: any) => ({
        userId: order.user,
        productId: item.product._id,
        activityType: 'purchase',
        metadata: {
          quantity: item.quantity,
          price: item.price
        }
      }));
      await UserActivity.insertMany(purchaseActivities);
      console.log(`Tracked ${purchaseActivities.length} purchase activities for order ${order.orderNumber}`);
    } catch (error) {
      console.warn('Failed to track purchase activity:', error);
    }

    // Award loyalty points
    try {
      const pointsEarned = await loyaltyService.earnPoints(
        order.user.toString(),
        order._id.toString(),
        order.total
      );
      console.log(`User ${order.user} earned ${pointsEarned} loyalty points from order ${order.orderNumber}`);
    } catch (error) {
      console.warn('Failed to award loyalty points:', error);
    }
  }

  await order.save();

  // Send notification to user about order status update
  try {
    const statusMessages: Record<string, string> = {
      pending: 'Đơn hàng của bạn đang chờ xác nhận',
      confirmed: 'Đơn hàng của bạn đã được xác nhận',
      preparing: 'Đơn hàng của bạn đang được chuẩn bị',
      shipping: 'Đơn hàng của bạn đang được giao',
      delivered: 'Đơn hàng của bạn đã được giao thành công',
      cancelled: 'Đơn hàng của bạn đã bị hủy'
    };

    await notificationService.create(order.user.toString(), {
      type: 'order_status',
      title: 'Cập nhật trạng thái đơn hàng',
      message: statusMessages[status] || `Trạng thái đơn hàng: ${status}`,
      data: {
        orderId: order._id,
        url: `/orders/${order._id}`
      }
    });

    // Queue email notification
    const user = await User.findById(order.user);
    if (user) {
      await addEmailJob({
        to: user.email,
        subject: `Đơn hàng #${order.orderNumber} - ${status}`,
        template: 'orderStatusUpdate',
        data: {
          customerName: user.firstName || user.email,
          orderNumber: order.orderNumber,
          status: statusMessages[status] || status
        }
      });
    }
  } catch (error) {
    console.warn('Failed to send order status notification:', error);
  }

  successResponse(res, order, 'Cập nhật trạng thái đơn hàng thành công');
});

// @desc    Update payment status (admin)
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { status, transactionId } = req.body;
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw NotFoundError('Không tìm thấy đơn hàng');
  }
  
  order.payment.status = status;
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }
  if (status === 'paid') {
    order.payment.paidAt = new Date();
  }
  
  await order.save();
  
  successResponse(res, order, 'Cập nhật trạng thái thanh toán thành công');
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
    totalRevenue,
    monthRevenue,
    pendingOrders,
    processingOrders,
    ordersByStatus,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, 'payment.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, 'payment.status': 'paid', createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'shipping'] } }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  
  successResponse(res, {
    totalOrders,
    todayOrders,
    monthOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    monthRevenue: monthRevenue[0]?.total || 0,
    pendingOrders,
    processingOrders,
    ordersByStatus: ordersByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>),
  });
});

// @desc    Get recent orders (admin)
// @route   GET /api/orders/admin/recent
// @access  Private/Admin
export const getRecentOrders = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 5;
  
  const orders = await Order.find()
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  successResponse(res, orders);
});
