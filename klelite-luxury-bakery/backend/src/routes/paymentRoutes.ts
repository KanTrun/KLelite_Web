import { Router } from 'express';
import {
  createMoMoPayment,
  momoIPN,
  createVNPayPayment,
  vnpayReturn,
  vnpayIPN,
  getPaymentStatus,
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

// MoMo routes
router.post('/momo/create', protect, createMoMoPayment);
router.post('/momo/ipn', momoIPN);

// VNPay routes
router.post('/vnpay/create', protect, createVNPayPayment);
router.get('/vnpay/return', vnpayReturn);
router.get('/vnpay/ipn', vnpayIPN);

// Payment status
router.get('/status/:orderId', protect, getPaymentStatus);

export default router;
