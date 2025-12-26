import express from 'express';
import { sendMessage } from '../controllers/chatbotController';
import { optionalAuth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';

const router = express.Router();

// Rate limit: 20 requests per 15 minutes per IP to prevent OpenAI quota drain
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many messages sent from this IP, please try again later.'
});

router.post('/message', optionalAuth, chatLimiter, sendMessage);

export default router;
