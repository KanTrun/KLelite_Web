import express from 'express';
import * as flashSaleController from '../controllers/flashSaleController';
import { protect, authorize } from '../middleware/auth';
import { validateFlashSaleReservation } from '../middleware/validation/flashSaleValidation';
import { rateLimit } from '../middleware/rate-limit';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * Get server time (for countdown sync)
 */
router.get('/time', flashSaleController.getServerTime);

/**
 * Get all active/upcoming flash sales
 */
router.get('/', flashSaleController.getActiveFlashSales);

/**
 * Get flash sale by slug
 */
router.get('/:slug', flashSaleController.getFlashSaleBySlug);

/**
 * Get product stock in flash sale
 */
router.get(
  '/:saleId/products/:productId/stock',
  flashSaleController.getProductStock
);

// ============================================================================
// PROTECTED ROUTES (Authenticated Users)
// ============================================================================

/**
 * Reserve stock for flash sale product
 * Rate limited to prevent abuse: 5 requests per minute per user
 */
router.post(
  '/:saleId/reserve',
  protect,
  rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many reservation attempts, please try again in a minute' }),
  validateFlashSaleReservation,
  flashSaleController.reserveStock
);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * Get all flash sales (admin only)
 */
router.get(
  '/admin/all',
  protect,
  authorize('ADMIN'),
  flashSaleController.getAllFlashSales
);

/**
 * Create new flash sale
 */
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  flashSaleController.createFlashSale
);

/**
 * Update flash sale
 */
router.put(
  '/:id',
  protect,
  authorize('ADMIN'),
  flashSaleController.updateFlashSale
);

/**
 * Cancel flash sale
 */
router.delete(
  '/:id',
  protect,
  authorize('ADMIN'),
  flashSaleController.cancelFlashSale
);

export default router;
