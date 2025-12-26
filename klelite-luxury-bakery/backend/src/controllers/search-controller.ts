import { Response, NextFunction } from 'express';
import { asyncHandler, successResponse, BadRequestError } from '../utils';
import { AuthRequest } from '../types';
import { searchService } from '../services/search-service';

/**
 * @desc    Search products with typo tolerance
 * @route   GET /api/search
 * @access  Public
 */
export const searchProducts = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { q, limit, category, minPrice, maxPrice } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      throw BadRequestError('Search query must be at least 2 characters');
    }

    const results = await searchService.search(q, {
      limit: limit ? parseInt(limit as string, 10) : 10,
      category: category as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    });

    successResponse(res, {
      ...results,
      message: `Found ${results.total} products in ${results.took}ms`,
    });
  }
);

/**
 * @desc    Get search auto-suggestions
 * @route   GET /api/search/suggest
 * @access  Public
 */
export const getSearchSuggestions = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      successResponse(res, { suggestions: [] });
      return;
    }

    const suggestions = await searchService.suggest(q, 5);

    successResponse(res, { suggestions });
  }
);
