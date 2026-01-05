import { Router } from 'express';
import {
  getPublicConfig,
  getAllConfigs,
  createConfig,
  updateConfig,
  activateConfig,
  deleteConfig
} from '../controllers/themeController';
import { protect, authorize } from '../middleware/auth';
import { validate, commonValidations, body } from '../middleware/validate';

const router = Router();

// Validation rules
const themeValidation = [
  commonValidations.requiredString('name', 1, 100),
  body('type').isIn(['default', 'christmas', 'tet', 'valentine']).withMessage('Invalid theme type'),
  body('hero.title').notEmpty().withMessage('Hero title is required'),
  body('hero.subtitle').notEmpty().withMessage('Hero subtitle is required'),
  body('hero.ctaText').notEmpty().withMessage('CTA text is required'),
  body('hero.ctaLink').notEmpty().withMessage('CTA link is required'),
  body('hero.backgroundImage').notEmpty().withMessage('Background image is required'),
];

// Public routes
router.get('/current', getPublicConfig);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllConfigs);
router.post('/', validate(themeValidation), createConfig);
router.put('/:id', validate(themeValidation), updateConfig);
router.patch('/:id/activate', activateConfig);
router.delete('/:id', deleteConfig);

export default router;
