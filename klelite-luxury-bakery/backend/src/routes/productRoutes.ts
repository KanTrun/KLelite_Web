import { Router } from 'express';
import {
  getProducts,
  getProduct,
  getProductById,
  getFeaturedProducts,
  getNewProducts,
  getBestsellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  addProductReview,
  getProductReviews,
} from '../controllers/productController';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';
import { uploadMultiple } from '../utils/upload';

const router = Router();

// Validation rules
const createProductValidation = [
  commonValidations.requiredString('name', 1, 200),
  body('description')
    .notEmpty()
    .withMessage('Vui lòng nhập mô tả sản phẩm'),
  commonValidations.requiredNumber('price', 0),
  commonValidations.objectId('category', 'body'),
  body('sku')
    .notEmpty()
    .withMessage('Vui lòng nhập mã SKU')
    .isLength({ max: 20 })
    .withMessage('Mã SKU không được quá 20 ký tự'),
  commonValidations.requiredNumber('stock', 0),
];

const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Vui lòng đánh giá sản phẩm')
    .isInt({ min: 1, max: 5 })
    .withMessage('Đánh giá phải từ 1 đến 5'),
  body('comment')
    .notEmpty()
    .withMessage('Vui lòng nhập nhận xét')
    .isLength({ max: 1000 })
    .withMessage('Nhận xét không được quá 1000 ký tự'),
];

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);
router.get('/bestsellers', getBestsellerProducts);
router.get('/:slug', getProduct);
router.get('/id/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected routes
router.post('/:id/reviews', protect, validate(reviewValidation), addProductReview);

// Admin routes
router.post('/', protect, authorize('admin'), validate(createProductValidation), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.post('/:id/images', protect, authorize('admin'), uploadMultiple, uploadProductImages);
router.delete('/:id/images/:imageId', protect, authorize('admin'), deleteProductImage);

export default router;
