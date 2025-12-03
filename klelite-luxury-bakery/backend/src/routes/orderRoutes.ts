import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  getOrderByNumber,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import { validate, body } from '../middleware/validate';

const router = Router();

// Validation rules
const createOrderValidation = [
  body('shippingAddress').notEmpty().withMessage('Vui lòng nhập địa chỉ giao hàng'),
  body('shippingAddress.fullName').notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('shippingAddress.phone')
    .notEmpty()
    .withMessage('Vui lòng nhập số điện thoại')
    .matches(/^(0|\+84)?[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  body('shippingAddress.address').notEmpty().withMessage('Vui lòng nhập địa chỉ'),
  body('shippingAddress.district').notEmpty().withMessage('Vui lòng nhập quận/huyện'),
  body('shippingAddress.city').notEmpty().withMessage('Vui lòng nhập thành phố'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Vui lòng chọn phương thức thanh toán')
    .isIn(['cod', 'bank_transfer', 'momo', 'vnpay', 'stripe'])
    .withMessage('Phương thức thanh toán không hợp lệ'),
];

const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Vui lòng chọn trạng thái')
    .isIn(['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
];

const updatePaymentValidation = [
  body('status')
    .notEmpty()
    .withMessage('Vui lòng chọn trạng thái thanh toán')
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Trạng thái thanh toán không hợp lệ'),
];

// Protected routes
router.use(protect);

router.post('/', validate(createOrderValidation), createOrder);
router.get('/', getMyOrders);
router.get('/number/:orderNumber', getOrderByNumber);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', authorize('admin', 'staff'), getAllOrders);
router.get('/admin/stats', authorize('admin'), getOrderStats);
router.put('/:id/status', authorize('admin', 'staff'), validate(updateStatusValidation), updateOrderStatus);
router.put('/:id/payment', authorize('admin'), validate(updatePaymentValidation), updatePaymentStatus);

export default router;
