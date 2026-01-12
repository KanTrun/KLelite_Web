import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';
import * as sseService from '../services/sseService';
import asyncHandler from '../utils/asyncHandler';
import { AuthRequest } from '../types';

/**
 * SSE Stream endpoint - establishes long-lived connection for real-time notifications
 * @route GET /api/v1/notifications/stream
 * @access Private
 */
export const streamNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Send initial comment to establish connection
  res.write(': connected\n\n');
  res.flushHeaders();

  // Add connection to SSE service
  sseService.addConnection(userId, res);

  // Send keep-alive ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
  });
});

/**
 * Get all notifications for current user
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = parseInt(req.query.skip as string) || 0;

  const notifications = await notificationService.getAll(userId, limit, skip);

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

/**
 * Get unread notifications count
 * @route GET /api/v1/notifications/unread-count
 * @access Private
 */
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await notificationService.getUnreadCount(userId);

  res.status(200).json({
    success: true,
    data: { count }
  });
});

/**
 * Get unread notifications
 * @route GET /api/v1/notifications/unread
 * @access Private
 */
export const getUnreadNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 20;

  const notifications = await notificationService.getUnread(userId, limit);

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  });
});

/**
 * Mark notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 */
export const markNotificationAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const notificationId = req.params.id;

  const notification = await notificationService.markAsRead(userId, notificationId);

  if (!notification) {
    res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/v1/notifications/read-all
 * @access Private
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const modifiedCount = await notificationService.markAllAsRead(userId);

  res.status(200).json({
    success: true,
    message: `${modifiedCount} notifications marked as read`,
    data: { modifiedCount }
  });
});

/**
 * Delete a notification
 * @route DELETE /api/v1/notifications/:id
 * @access Private
 */
export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const notificationId = req.params.id;

  const deleted = await notificationService.deleteNotification(userId, notificationId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

/**
 * Get SSE connection stats (Admin only)
 * @route GET /api/v1/notifications/stats
 * @access Private/Admin
 */
export const getConnectionStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const connectionCount = sseService.getConnectionCount();
  const userCount = sseService.getUserCount();

  res.status(200).json({
    success: true,
    data: {
      activeConnections: connectionCount,
      connectedUsers: userCount
    }
  });
});
