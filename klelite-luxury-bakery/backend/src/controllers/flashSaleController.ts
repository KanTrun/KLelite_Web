import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import flashSaleService from '../services/flashSaleService';
import prisma from '../lib/prisma';
import { FlashSale, LoyaltyAccount } from '@prisma/client';
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

  const flashSales = await prisma.flashSale.findMany({
    where: {
      status: { in: ['UPCOMING', 'ACTIVE'] },
      endTime: { gt: now },
    },
    orderBy: { startTime: 'asc' },
    include: {
      products: {
        include: {
          product: {
            select: { name: true, slug: true, images: true }
          }
        }
      }
    }
  });

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

  const flashSale = await prisma.flashSale.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              description: true,
              images: true,
              categoryId: true
            }
          }
        }
      }
    }
  });

  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  // Get current stock for each product
  const productsWithStock = await Promise.all(
    flashSale.products.map(async (product: any) => {
      const stock = await flashSaleService.getProductStock(
        flashSale.id,
        product.productId
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
  const userId = (req as any).user?.id;

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
  const loyaltyAccount = await prisma.loyaltyAccount.findUnique({ where: { userId } });
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
  const flashSale = await prisma.flashSale.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      earlyAccessTiers: earlyAccessTiers || [],
      earlyAccessMin: earlyAccessMinutes || 30,
    },
  });

  // Initialize stock in Redis if sale is starting soon
  const now = new Date();
  const isStartingSoon = new Date(startTime) <= new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  if (isStartingSoon) {
    await flashSaleService.initializeSaleStock(flashSale as any);
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

  const flashSale = await prisma.flashSale.findUnique({ where: { id } });
  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  // Cannot update active or ended sales
  if (flashSale.status === 'ACTIVE') {
    throw new AppError('Cannot update active flash sale', 400);
  }
  if (flashSale.status === 'ENDED') {
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

  const updateData: any = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedFlashSale = await prisma.flashSale.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    data: updatedFlashSale,
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

  const flashSale = await prisma.flashSale.findUnique({ where: { id } });
  if (!flashSale) {
    throw new AppError('Flash sale not found', 404);
  }

  if (flashSale.status === 'ENDED') {
    throw new AppError('Cannot cancel ended flash sale', 400);
  }

  // Note: CANCELLED is not in the enum, use ENDED instead
  await prisma.flashSale.delete({
    where: { id },
  });

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

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const flashSales = await prisma.flashSale.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: (Number(page) - 1) * Number(limit),
  });

  const total = await prisma.flashSale.count({ where });

  res.json({
    success: true,
    count: flashSales.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: flashSales,
  });
});
