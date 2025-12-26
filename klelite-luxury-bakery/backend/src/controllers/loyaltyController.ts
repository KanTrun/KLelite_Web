import { Response, NextFunction } from 'express';
import { asyncHandler, successResponse, BadRequestError } from '../utils';
import { AuthRequest } from '../types';
import { loyaltyService } from '../services/loyalty-service';

// @desc    Get my loyalty account
// @route   GET /api/loyalty
// @access  Private
export const getMyLoyalty = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const account = await loyaltyService.getOrCreateAccount(req.user!._id.toString());
    const tierInfo = loyaltyService.getTierBenefits(account.tier);

    successResponse(res, {
      ...account.toObject(),
      tierInfo,
    });
  }
);

// @desc    Get loyalty points history
// @route   GET /api/loyalty/history
// @access  Private
export const getPointsHistory = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const account = await loyaltyService.getOrCreateAccount(req.user!._id.toString());

    // Return history in reverse chronological order
    const history = [...account.history].reverse();

    successResponse(res, { history });
  }
);

// @desc    Validate points redemption
// @route   POST /api/loyalty/validate-redemption
// @access  Private
export const validateRedemption = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { points } = req.body;

    if (!points || points <= 0) {
      throw BadRequestError('Invalid points amount');
    }

    const account = await loyaltyService.getOrCreateAccount(req.user!._id.toString());

    if (account.currentPoints < points) {
      throw BadRequestError('Insufficient points');
    }

    const discount = points * 10; // 1 point = 10 VND

    successResponse(res, {
      valid: true,
      discount,
      remainingPoints: account.currentPoints - points,
    });
  }
);

// @desc    Adjust user points (Admin only)
// @route   POST /api/loyalty/adjust
// @access  Private/Admin
export const adjustPoints = asyncHandler(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { userId, amount, description } = req.body;

    if (!userId || amount === undefined || !description) {
      throw BadRequestError('userId, amount, and description are required');
    }

    const account = await loyaltyService.adjustPoints(
      userId,
      amount,
      description
    );

    successResponse(res, account, 'Points adjusted successfully');
  }
);

// @desc    Get all tiers info
// @route   GET /api/loyalty/tiers
// @access  Public
export const getTiersInfo = asyncHandler(
  async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'].map((tier) =>
      loyaltyService.getTierBenefits(tier)
    );

    successResponse(res, { tiers });
  }
);
