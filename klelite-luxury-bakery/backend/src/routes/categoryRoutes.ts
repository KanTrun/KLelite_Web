import { Router } from 'express';
import {
  getCategories,
  getAllCategories,
  getCategory,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';

const router = Router();

// Validation rules
const createCategoryValidation = [
  commonValidations.requiredString('name', 1, 100),
  commonValidations.optionalString('description', 500),
  commonValidations.optionalNumber('order', 0),
];

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategory);
router.get('/id/:id', getCategoryById);

// Admin routes
router.get('/admin/all', protect, authorize('ADMIN'), getAllCategories);
router.post('/', protect, authorize('ADMIN'), validate(createCategoryValidation), createCategory);
router.put('/:id', protect, authorize('ADMIN'), updateCategory);
router.delete('/:id', protect, authorize('ADMIN'), deleteCategory);

export default router;
