import { Response, NextFunction } from 'express';
import { asyncHandler, successResponse } from '../utils';
import { AuthRequest } from '../types';
import { recommendationService } from '../services/recommendationService';
import Product from '../models/Product';

// @desc    Get similar products
// @route   GET /api/recommendations/similar/:productId
// @access  Public
export const getSimilarProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit as string) || 6;

  const productIds = await recommendationService.getSimilarProducts(productId, limit);
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name slug price images rating numReviews category isAvailable')
    .populate('category', 'name slug');

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
  const productIds = await recommendationService.getPersonalizedRecommendations(req.user._id.toString(), limit);

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name slug price images rating numReviews category isAvailable')
    .populate('category', 'name slug');

  successResponse(res, products);
});

// @desc    Get trending products
// @route   GET /api/recommendations/trending
// @access  Public
export const getTrending = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  const productIds = await recommendationService.getTrending(limit);

  const products = await Product.find({ _id: { $in: productIds } })
    .select('name slug price images rating numReviews category isAvailable')
    .populate('category', 'name slug');

  successResponse(res, products);
});
