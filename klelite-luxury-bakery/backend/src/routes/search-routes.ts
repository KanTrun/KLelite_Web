import { Router } from 'express';
import { searchProducts, getSearchSuggestions } from '../controllers/search-controller';
import { rateLimit } from '../middleware/rate-limit';

const router = Router();

/**
 * Search routes with rate limiting to prevent abuse
 */
router.get('/', rateLimit({ windowMs: 60000, max: 30 }), searchProducts);
router.get('/suggest', rateLimit({ windowMs: 60000, max: 60 }), getSearchSuggestions);

export default router;
