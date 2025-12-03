import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart,
} from '../controllers/cartController';
import { protect } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';

const router = Router();

// Validation rules
const addToCartValidation = [
  commonValidations.objectId('productId', 'body'),
  body('quantity')
    .notEmpty()
    .withMessage('Vui lòng nhập số lượng')
    .isInt({ min: 1 })
    .withMessage('Số lượng phải lớn hơn 0'),
];

const updateCartItemValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Vui lòng nhập số lượng')
    .isInt({ min: 0 })
    .withMessage('Số lượng không hợp lệ'),
];

// All routes are protected
router.use(protect);

router.get('/', getCart);
router.post('/items', validate(addToCartValidation), addToCart);
router.put('/items/:itemId', validate(updateCartItemValidation), updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);
router.post('/sync', syncCart);

export default router;
