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
router.get('/admin/all', protect, authorize('admin'), getAllCategories);
router.post('/', protect, authorize('admin'), validate(createCategoryValidation), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
