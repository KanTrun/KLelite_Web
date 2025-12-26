import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import flashSaleService from '../services/flashSaleService';
import { FlashSale, LoyaltyAccount } from '../models';
import AppError from '../utils/AppError';

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * @desc    Get active flash sales
 * @route   GET /api/flash-sales
 * @access  Public
 */
export const getActiveFlashSales = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();

  const flashSales = await FlashSale.find({
    status: { $in: ['scheduled', 'active'] },
    endTime: { $gt: now },
  })
    .populate('products.productId', 'name slug images')
    .sort({ startTime: 1 })
    .lean();

  res.json({
    success: true,
    count: flashSales.length,
    data: flashSales,
  });
});

/**
 * @desc    Get flash sale by slug
 * @route   GET /api/flash-sales/:slug
 * @access  Public
 */
export const getFlashSaleBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const flashSale = await FlashSale.findOne({ slug })
    .populate('products.productId', 'name slug description images category')
    .lean();

  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  // Get current stock for each product
  const productsWithStock = await Promise.all(
    flashSale.products.map(async (product) => {
      const stock = await flashSaleService.getProductStock(
        flashSale._id.toString(),
        product.productId.toString()
      );
      return {
        ...product,
        currentStock: stock,
      };
    })
  );

  res.json({
    success: true,
    data: {
      ...flashSale,
      products: productsWithStock,
    },
  });
});

/**
 * @desc    Get server time (for countdown sync)
 * @route   GET /api/flash-sales/time
 * @access  Public
 */
export const getServerTime = asyncHandler(async (req: Request, res: Response) => {
  const time = flashSaleService.getServerTime();
  res.json({
    success: true,
    data: time,
  });
});

/**
 * @desc    Get product stock in flash sale
 * @route   GET /api/flash-sales/:saleId/products/:productId/stock
 * @access  Public
 */
export const getProductStock = asyncHandler(async (req: Request, res: Response) => {
  const { saleId, productId } = req.params;

  const stock = await flashSaleService.getProductStock(saleId, productId);

  res.json({
    success: true,
    data: { stock },
  });
});

// ============================================================================
// PROTECTED ENDPOINTS (Authenticated Users)
// ============================================================================

/**
 * @desc    Reserve stock for flash sale product
 * @route   POST /api/flash-sales/:saleId/reserve
 * @access  Protected
 */
export const reserveStock = asyncHandler(async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const { productId, quantity } = req.body;
  const userId = req.user?._id.toString();

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!productId || !quantity) {
    throw new AppError('Product ID and quantity are required', 400);
  }

  if (quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  // Get user's loyalty tier
  const loyaltyAccount = await LoyaltyAccount.findOne({ userId });
  const loyaltyTier = loyaltyAccount?.tier;

  // Reserve stock
  const reservation = await flashSaleService.reserveStock(
    saleId,
    productId,
    userId,
    quantity,
    loyaltyTier
  );

  res.status(201).json({
    success: true,
    data: reservation,
    message: 'Stock reserved successfully. Complete checkout within 5 minutes.',
  });
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * @desc    Create new flash sale
 * @route   POST /api/flash-sales
 * @access  Admin
 */
export const createFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    startTime,
    endTime,
    products,
    earlyAccessTiers,
    earlyAccessMinutes,
  } = req.body;

  // Validate required fields
  if (!name || !startTime || !endTime || !products || !products.length) {
    throw new AppError('Missing required fields', 400);
  }

  // Validate time range
  if (new Date(endTime) <= new Date(startTime)) {
    throw new AppError('End time must be after start time', 400);
  }

  // Create flash sale
  const flashSale = await FlashSale.create({
    name,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    products,
    earlyAccessTiers: earlyAccessTiers || [],
    earlyAccessMinutes: earlyAccessMinutes || 30,
  });

  // Initialize stock in Redis if sale is starting soon
  const now = new Date();
  const isStartingSoon = new Date(startTime) <= new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  if (isStartingSoon) {
    await flashSaleService.initializeSaleStock(flashSale);
  }

  res.status(201).json({
    success: true,
    data: flashSale,
    message: 'Flash sale created successfully',
  });
});

/**
 * @desc    Update flash sale
 * @route   PUT /api/flash-sales/:id
 * @access  Admin
 */
export const updateFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const flashSale = await FlashSale.findById(id);
  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  // Cannot update active or ended sales
  if (flashSale.status === 'active') {
    throw new AppError('Cannot update active flash sale', 400);
  }
  if (flashSale.status === 'ended') {
    throw new AppError('Cannot update ended flash sale', 400);
  }

  // Update fields
  const allowedUpdates = [
    'name',
    'description',
    'startTime',
    'endTime',
    'products',
    'earlyAccessTiers',
    'earlyAccessMinutes',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      (flashSale as any)[field] = req.body[field];
    }
  });

  await flashSale.save();

  res.json({
    success: true,
    data: flashSale,
    message: 'Flash sale updated successfully',
  });
});

/**
 * @desc    Cancel flash sale
 * @route   DELETE /api/flash-sales/:id
 * @access  Admin
 */
export const cancelFlashSale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const flashSale = await FlashSale.findById(id);
  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  if (flashSale.status === 'ended') {
    throw new AppError('Cannot cancel ended flash sale', 400);
  }

  flashSale.status = 'cancelled';
  await flashSale.save();

  res.json({
    success: true,
    message: 'Flash sale cancelled successfully',
  });
});

/**
 * @desc    Get all flash sales (admin)
 * @route   GET /api/admin/flash-sales
 * @access  Admin
 */
export const getAllFlashSales = asyncHandler(async (req: Request, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query: any = {};
  if (status) {
    query.status = status;
  }

  const flashSales = await FlashSale.find(query)
    .populate('products.productId', 'name slug')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await FlashSale.countDocuments(query);

  res.json({
    success: true,
    count: flashSales.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: flashSales,
  });
});
