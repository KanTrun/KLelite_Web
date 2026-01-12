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
  commonValidations.uuid('category', 'body'),
  body('sku')
    .notEmpty()
    .withMessage('Vui lòng nhập mã SKU')
    .isLength({ max: 20 })
    .withMessage('Mã SKU không được quá 20 ký tự'),
  commonValidations.requiredNumber('stock', 0),
];

const updateProductValidation = [
  // Name - optional but must be valid if provided
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tên sản phẩm phải từ 1 đến 200 ký tự'),

  // Description - optional
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Mô tả sản phẩm không được để trống'),

  // Price - optional but must be >= 0
  commonValidations.optionalNumber('price', 0),

  // Compare price - optional
  commonValidations.optionalNumber('comparePrice', 0),

  // Category - optional, can be UUID or object with id field
  body('category')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          throw new Error('Category ID không hợp lệ');
        }
      } else if (typeof value === 'object' && value !== null) {
        // If object, must have id field
        if (!value.id || typeof value.id !== 'string') {
          throw new Error('Category object phải có trường id');
        }
      } else {
        throw new Error('Category phải là UUID hoặc object');
      }
      return true;
    }),

  // SKU - optional but must be valid
  body('sku')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Mã SKU không được quá 20 ký tự'),

  // Stock - optional but must be >= 0
  commonValidations.optionalNumber('stock', 0),

  // Boolean flags - optional
  commonValidations.optionalBoolean('isFeatured'),
  commonValidations.optionalBoolean('isAvailable'),
  commonValidations.optionalBoolean('isNewProduct'),

  // Images - reject if present (handled separately)
  // body('images')
  //   .optional()
  //   .custom(() => {
  //     throw new Error('Không thể cập nhật images qua endpoint này. Sử dụng /products/:id/images');
  //   }),
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
router.post('/', protect, authorize('ADMIN'), validate(createProductValidation), createProduct);
router.put('/:id', protect, authorize('ADMIN'), validate(updateProductValidation), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);
router.post('/:id/images', protect, authorize('ADMIN'), uploadMultiple, uploadProductImages);
router.delete('/:id/images/:imageId', protect, authorize('ADMIN'), deleteProductImage);

export default router;
