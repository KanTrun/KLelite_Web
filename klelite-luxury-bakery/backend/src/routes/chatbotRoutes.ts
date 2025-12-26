import express from 'express';
import { sendMessage } from '../controllers/chatbotController';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

router.post('/message', optionalAuth, sendMessage);

export default router;
