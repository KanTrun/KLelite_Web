import express from 'express';
import { getSimilarProducts, getForYou, getTrending } from '../controllers/recommendationController';
import { protect, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/similar/:productId', getSimilarProducts);
router.get('/trending', getTrending);
router.get('/for-you', protect, getForYou);

export default router;
