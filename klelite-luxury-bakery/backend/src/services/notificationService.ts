import prisma from '../lib/prisma';
import * as sseService from './sseService';
import { Notification } from '@prisma/client';

export interface CreateNotificationDTO {
  type: 'ORDER_STATUS' | 'POINTS_EARNED' | 'FLASH_SALE' | 'PROMOTION' | 'SYSTEM';
  title: string;
  message: string;
  data?: any;
}

/**
 * Create a new notification and publish via SSE
 */
export const create = async (
  userId: string,
  data: CreateNotificationDTO
): Promise<Notification> => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      ...data
    }
  });

  // Publish to SSE (handles both single-server and multi-server via Redis Pub/Sub)
  await sseService.publish(userId, notification);

  return notification;
};

/**
 * Get unread notifications for a user
 */
export const getUnread = async (userId: string, limit: number = 20): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

/**
 * Get all notifications for a user (paginated)
 */
export const getAll = async (
  userId: string,
  limit: number = 50,
  skip: number = 0
): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  });
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (
  userId: string,
  notificationId: string
): Promise<Notification | null> => {
  return prisma.notification.update({
    where: { id: notificationId, userId },
    data: { read: true, readAt: new Date() }
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() }
  });

  return result.count;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({ where: { userId, read: false } });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<boolean> => {
  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId }
  });

  return result.count > 0;
};

/**
 * Delete all read notifications older than X days
 */
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: cutoffDate }
    }
  });

  return result.count;
};

/**
 * Batch create notifications for multiple users (e.g., promotions, flash sale alerts)
 */
export const createBatch = async (
  userIds: string[],
  data: CreateNotificationDTO
): Promise<Notification[]> => {
  const notifications = await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      ...data
    }))
  });

  // Fetch created notifications to publish to SSE
  const createdNotifications = await prisma.notification.findMany({
    where: {
      userId: { in: userIds },
      createdAt: { gte: new Date(Date.now() - 1000) } // Created in last second
    },
    orderBy: { createdAt: 'desc' }
  });

  // Publish to SSE for each user
  for (const notification of createdNotifications) {
    await sseService.publish(notification.userId, notification);
  }

  return createdNotifications;
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
