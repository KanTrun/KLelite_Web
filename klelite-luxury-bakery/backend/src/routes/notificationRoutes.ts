import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { protect } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for SSE connections (prevent abuse)
const sseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 SSE connection attempts per 15 minutes
  message: 'Too many SSE connection attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// SSE Stream endpoint
router.get('/stream', protect, sseRateLimiter, notificationController.streamNotifications);

// Get all notifications
router.get('/', protect, notificationController.getNotifications);

// Get unread notifications
router.get('/unread', protect, notificationController.getUnreadNotifications);

// Get unread count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// Mark all as read
router.patch('/read-all', protect, notificationController.markAllAsRead);

// Mark specific notification as read
router.patch('/:id/read', protect, notificationController.markNotificationAsRead);

// Delete notification
router.delete('/:id', protect, notificationController.deleteNotification);

// Connection stats (admin only - can add admin middleware later)
router.get('/stats', protect, notificationController.getConnectionStats);

export default router;
