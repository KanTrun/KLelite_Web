import express from 'express';
import * as flashSaleController from '../controllers/flashSaleController';
import { protect, authorize } from '../middleware/auth';
import { validateFlashSaleReservation } from '../middleware/validation/flashSaleValidation';

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
 */
router.post(
  '/:saleId/reserve',
  protect,
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
  authorize('admin'),
  flashSaleController.getAllFlashSales
);

/**
 * Create new flash sale
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  flashSaleController.createFlashSale
);

/**
 * Update flash sale
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  flashSaleController.updateFlashSale
);

/**
 * Cancel flash sale
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  flashSaleController.cancelFlashSale
);

export default router;
