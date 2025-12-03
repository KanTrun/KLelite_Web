import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleAuth,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';

const router = Router();

// Validation rules
const registerValidation = [
  commonValidations.email,
  commonValidations.password,
  commonValidations.requiredString('firstName', 1, 50),
  commonValidations.requiredString('lastName', 1, 50),
  commonValidations.phone,
];

const loginValidation = [
  commonValidations.email,
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
];

const forgotPasswordValidation = [
  commonValidations.email,
];

const resetPasswordValidation = [
  commonValidations.password,
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
  body('newPassword')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu mới')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
];

// Public routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.post('/google', googleAuth);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordValidation), resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, validate(updatePasswordValidation), updatePassword);

export default router;
