import { Router } from 'express';
import {
  validateVoucher,
  getAvailableVouchers,
  getVouchers,
  getVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from '../controllers/voucherController';
import { protect, authorize } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';

const router = Router();

// Validation rules
const validateVoucherValidation = [
  body('code').notEmpty().withMessage('Vui lòng nhập mã voucher'),
  commonValidations.requiredNumber('orderTotal', 0),
];

const createVoucherValidation = [
  body('code')
    .notEmpty()
    .withMessage('Vui lòng nhập mã voucher')
    .isLength({ max: 20 })
    .withMessage('Mã voucher không được quá 20 ký tự'),
  body('description').notEmpty().withMessage('Vui lòng nhập mô tả voucher'),
  body('type')
    .notEmpty()
    .withMessage('Vui lòng chọn loại voucher')
    .isIn(['percentage', 'fixed'])
    .withMessage('Loại voucher không hợp lệ'),
  commonValidations.requiredNumber('value', 0),
  commonValidations.requiredDate('startDate'),
  commonValidations.requiredDate('endDate'),
];

// Protected routes
router.use(protect);

router.post('/validate', validate(validateVoucherValidation), validateVoucher);
router.get('/available', getAvailableVouchers);

// Admin routes
router.get('/', authorize('admin'), getVouchers);
router.get('/:id', authorize('admin'), getVoucher);
router.post('/', authorize('admin'), validate(createVoucherValidation), createVoucher);
router.put('/:id', authorize('admin'), updateVoucher);
router.delete('/:id', authorize('admin'), deleteVoucher);

export default router;
