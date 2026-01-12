import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse } from '../utils';
import { AuthRequest } from '../types';
import { recommendationService } from '../services/recommendationService';

// @desc    Get similar products
// @route   GET /api/recommendations/similar/:productId
// @access  Public
export const getSimilarProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit as string) || 6;

  const productIds = await recommendationService.getSimilarProducts(productId, limit);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      rating: true,
      numReviews: true,
      isAvailable: true,
      images: {
        where: { isMain: true },
        take: 1
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  successResponse(res, products);
});

// @desc    Get personalized recommendations
// @route   GET /api/recommendations/for-you
// @access  Private
export const getForYou = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  if (!req.user) {
    successResponse(res, []);
    return;
  }

  const limit = parseInt(req.query.limit as string) || 8;
  const productIds = await recommendationService.getPersonalizedRecommendations(req.user.id.toString(), limit);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      rating: true,
      numReviews: true,
      isAvailable: true,
      images: {
        where: { isMain: true },
        take: 1
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  successResponse(res, products);
});

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
export const getTrending = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  const productIds = await recommendationService.getTrending(limit);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      rating: true,
      numReviews: true,
      isAvailable: true,
      images: {
        where: { isMain: true },
        take: 1
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  successResponse(res, products);
});
