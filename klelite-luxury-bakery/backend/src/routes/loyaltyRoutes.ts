import { Router } from 'express';
import {
  getMyLoyalty,
  getPointsHistory,
  validateRedemption,
  adjustPoints,
  getTiersInfo,
} from '../controllers/loyaltyController';
import { protect, authorize } from '../middleware/auth';
import { validate, body } from '../middleware/validate';

const router = Router();

// Public routes
router.get('/tiers', getTiersInfo);

// Protected routes
router.use(protect);

router.get('/', getMyLoyalty);
router.get('/history', getPointsHistory);
router.post(
  '/validate-redemption',
  validate([
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  ]),
  validateRedemption
);

// Admin routes
router.post(
  '/adjust',
  authorize('admin'),
  validate([
    body('userId').notEmpty().withMessage('User ID is required'),
    body('amount').isInt().withMessage('Amount must be an integer'),
    body('description').notEmpty().withMessage('Description is required'),
  ]),
  adjustPoints
);

export default router;
