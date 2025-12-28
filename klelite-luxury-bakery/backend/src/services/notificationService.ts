import Notification, { INotification } from '../models/Notification';
import * as sseService from './sseService';
import { Types } from 'mongoose';

export interface CreateNotificationDTO {
  type: 'order_status' | 'points_earned' | 'flash_sale' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: {
    orderId?: Types.ObjectId;
    productId?: Types.ObjectId;
    url?: string;
    [key: string]: any;
  };
}

/**
 * Create a new notification and publish via SSE
 */
export const create = async (
  userId: string | Types.ObjectId,
  data: CreateNotificationDTO
): Promise<INotification> => {
  const notification = await Notification.create({
    userId,
    ...data
  });

  // Publish to SSE (handles both single-server and multi-server via Redis Pub/Sub)
  await sseService.publish(userId.toString(), notification.toObject());

  return notification;
};

/**
 * Get unread notifications for a user
 */
export const getUnread = async (userId: string | Types.ObjectId, limit: number = 20): Promise<any[]> => {
  return Notification.find({ userId, read: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get all notifications for a user (paginated)
 */
export const getAll = async (
  userId: string | Types.ObjectId,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> => {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (
  userId: string | Types.ObjectId,
  notificationId: string | Types.ObjectId
): Promise<INotification | null> => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string | Types.ObjectId): Promise<number> => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );

  return result.modifiedCount;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string | Types.ObjectId): Promise<number> => {
  return Notification.countDocuments({ userId, read: false });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  userId: string | Types.ObjectId,
  notificationId: string | Types.ObjectId
): Promise<boolean> => {
  const result = await Notification.deleteOne({ _id: notificationId, userId });
  return result.deletedCount > 0;
};

/**
 * Delete all read notifications older than X days
 */
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await Notification.deleteMany({
    read: true,
    createdAt: { $lt: cutoffDate }
  });

  return result.deletedCount;
};

/**
 * Batch create notifications for multiple users (e.g., promotions, flash sale alerts)
 */
export const createBatch = async (
  userIds: (string | Types.ObjectId)[],
  data: CreateNotificationDTO
): Promise<any[]> => {
  const notifications = await Notification.insertMany(
    userIds.map(userId => ({
      userId: new Types.ObjectId(userId.toString()),
      ...data
    }))
  );

  // Publish to SSE for each user
  for (let i = 0; i < notifications.length; i++) {
    await sseService.publish(
      userIds[i].toString(),
      notifications[i].toObject()
    );
  }

  return notifications;
};

export default {
  create,
  getUnread,
  getAll,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  cleanupOldNotifications,
  createBatch
};
