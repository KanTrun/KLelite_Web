import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';
import userRoutes from './userRoutes';
import voucherRoutes from './voucherRoutes';
import uploadRoutes from './uploadRoutes';
import paymentRoutes from './paymentRoutes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/upload', uploadRoutes);
router.use('/payments', paymentRoutes);

export default router;
