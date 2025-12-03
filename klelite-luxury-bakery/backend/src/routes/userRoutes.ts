import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';
import { uploadSingle } from '../utils/upload';

const router = Router();

// Validation rules
const updateProfileValidation = [
  commonValidations.optionalString('firstName', 50),
  commonValidations.optionalString('lastName', 50),
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9}$/)
    .withMessage('Số điện thoại không hợp lệ'),
];

const addressValidation = [
  body('fullName').notEmpty().withMessage('Vui lòng nhập họ tên'),
  body('phone')
    .notEmpty()
    .withMessage('Vui lòng nhập số điện thoại')
    .matches(/^(0|\+84)?[0-9]{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ'),
  body('address').notEmpty().withMessage('Vui lòng nhập địa chỉ'),
  body('district').notEmpty().withMessage('Vui lòng nhập quận/huyện'),
  body().custom((value) => {
    if (!value.city && !value.province) {
      throw new Error('Vui lòng nhập tỉnh/thành phố');
    }
    return true;
  }),
];

// All routes are protected
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileValidation), updateProfile);
router.put('/avatar', uploadSingle, updateAvatar);

// Address routes
router.get('/addresses', getProfile); // Returns user with addresses
router.post('/addresses', validate(addressValidation), addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Wishlist routes
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Admin routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
