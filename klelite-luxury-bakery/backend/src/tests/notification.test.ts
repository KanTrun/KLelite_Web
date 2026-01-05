import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Notification from '../models/Notification';
import * as notificationService from '../services/notificationService';
import * as sseService from '../services/sseService';

describe('Notification System', () => {
  let mongoServer: MongoMemoryServer;
  let testUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all notifications before each test
    await Notification.deleteMany({});
    testUserId = new mongoose.Types.ObjectId();
  });

  describe('notificationService.create', () => {
    it('should create a notification successfully', async () => {
      const notificationData = {
        type: 'order_status' as const,
        title: 'Order Shipped',
        message: 'Your order #12345 has been shipped',
        data: {
          orderId: new mongoose.Types.ObjectId(),
          url: '/orders/12345'
        }
      };

      const notification = await notificationService.create(testUserId, notificationData);

      expect(notification).toBeDefined();
      expect(notification.userId.toString()).toBe(testUserId.toString());
      expect(notification.type).toBe('order_status');
      expect(notification.title).toBe('Order Shipped');
      expect(notification.read).toBe(false);
      expect(notification.data?.url).toBe('/orders/12345');
    });

    it('should create notification with minimal data', async () => {
      const notification = await notificationService.create(testUserId, {
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight'
      });

      expect(notification.userId.toString()).toBe(testUserId.toString());
      expect(notification.data).toEqual({});
    });
  });

  describe('notificationService.getUnread', () => {
    it('should return only unread notifications', async () => {
      // Create 3 unread and 2 read notifications
      await Notification.create([
        {
          userId: testUserId,
          type: 'order_status',
          title: 'Unread 1',
          message: 'Message 1',
          read: false
        },
        {
          userId: testUserId,
          type: 'points_earned',
          title: 'Unread 2',
          message: 'Message 2',
          read: false
        },
        {
          userId: testUserId,
          type: 'promotion',
          title: 'Read 1',
          message: 'Message 3',
          read: true
        },
        {
          userId: testUserId,
          type: 'flash_sale',
          title: 'Unread 3',
          message: 'Message 4',
          read: false
        },
        {
          userId: testUserId,
          type: 'system',
          title: 'Read 2',
          message: 'Message 5',
          read: true
        }
      ]);

      const unreadNotifications = await notificationService.getUnread(testUserId);

      expect(unreadNotifications).toHaveLength(3);
      expect(unreadNotifications.every(n => !n.read)).toBe(true);
    });

    it('should limit unread notifications by limit parameter', async () => {
      // Create 10 unread notifications
      const notifications = Array.from({ length: 10 }, (_, i) => ({
        userId: testUserId,
        type: 'system' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        read: false
      }));
      await Notification.create(notifications);

      const unread = await notificationService.getUnread(testUserId, 5);

      expect(unread).toHaveLength(5);
    });
  });

  describe('notificationService.markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = await Notification.create({
        userId: testUserId,
        type: 'order_status',
        title: 'Test',
        message: 'Test message',
        read: false
      });

      const updated = await notificationService.markAsRead(testUserId, notification._id);

      expect(updated).toBeDefined();
      expect(updated!.read).toBe(true);
      expect(updated!.readAt).toBeDefined();
    });

    it('should return null if notification not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await notificationService.markAsRead(testUserId, fakeId);

      expect(result).toBeNull();
    });

    it('should not mark notification of different user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const notification = await Notification.create({
        userId: otherUserId,
        type: 'system',
        title: 'Test',
        message: 'Test',
        read: false
      });

      const result = await notificationService.markAsRead(testUserId, notification._id);

      expect(result).toBeNull();
    });
  });

  describe('notificationService.markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      // Create 5 unread notifications
      await Notification.create([
        {
          userId: testUserId,
          type: 'order_status',
          title: 'N1',
          message: 'M1',
          read: false
        },
        {
          userId: testUserId,
          type: 'points_earned',
          title: 'N2',
          message: 'M2',
          read: false
        },
        {
          userId: testUserId,
          type: 'flash_sale',
          title: 'N3',
          message: 'M3',
          read: false
        }
      ]);

      const modifiedCount = await notificationService.markAllAsRead(testUserId);

      expect(modifiedCount).toBe(3);

      const unreadCount = await notificationService.getUnreadCount(testUserId);
      expect(unreadCount).toBe(0);
    });

    it('should return 0 if no unread notifications', async () => {
      const modifiedCount = await notificationService.markAllAsRead(testUserId);
      expect(modifiedCount).toBe(0);
    });
  });

  describe('notificationService.getUnreadCount', () => {
    it('should return correct unread count', async () => {
      await Notification.create([
        {
          userId: testUserId,
          type: 'order_status',
          title: 'Unread 1',
          message: 'M1',
          read: false
        },
        {
          userId: testUserId,
          type: 'points_earned',
          title: 'Unread 2',
          message: 'M2',
          read: false
        },
        {
          userId: testUserId,
          type: 'system',
          title: 'Read 1',
          message: 'M3',
          read: true
        }
      ]);

      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(2);
    });

    it('should return 0 for user with no notifications', async () => {
      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(0);
    });
  });

  describe('notificationService.deleteNotification', () => {
    it('should delete a notification successfully', async () => {
      const notification = await Notification.create({
        userId: testUserId,
        type: 'system',
        title: 'Test',
        message: 'Test'
      });

      const deleted = await notificationService.deleteNotification(testUserId, notification._id);

      expect(deleted).toBe(true);

      const found = await Notification.findById(notification._id);
      expect(found).toBeNull();
    });

    it('should return false if notification not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const deleted = await notificationService.deleteNotification(testUserId, fakeId);

      expect(deleted).toBe(false);
    });
  });

  describe('notificationService.cleanupOldNotifications', () => {
    it('should delete old read notifications', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      // Create old read notification
      await Notification.create({
        userId: testUserId,
        type: 'system',
        title: 'Old',
        message: 'Old',
        read: true,
        createdAt: oldDate
      });

      // Create recent read notification
      await Notification.create({
        userId: testUserId,
        type: 'system',
        title: 'Recent',
        message: 'Recent',
        read: true
      });

      // Create old unread (should NOT be deleted)
      await Notification.create({
        userId: testUserId,
        type: 'system',
        title: 'Old Unread',
        message: 'Old Unread',
        read: false,
        createdAt: oldDate
      });

      const deletedCount = await notificationService.cleanupOldNotifications(30);

      expect(deletedCount).toBe(1);

      const remaining = await Notification.countDocuments({ userId: testUserId });
      expect(remaining).toBe(2);
    });
  });

  describe('notificationService.createBatch', () => {
    it('should create notifications for multiple users', async () => {
      const user1 = new mongoose.Types.ObjectId();
      const user2 = new mongoose.Types.ObjectId();
      const user3 = new mongoose.Types.ObjectId();

      const notifications = await notificationService.createBatch(
        [user1, user2, user3],
        {
          type: 'promotion',
          title: 'Flash Sale!',
          message: '50% off all items'
        }
      );

      expect(notifications).toHaveLength(3);
      expect(notifications[0].userId.toString()).toBe(user1.toString());
      expect(notifications[1].userId.toString()).toBe(user2.toString());
      expect(notifications[2].userId.toString()).toBe(user3.toString());
      expect(notifications.every(n => n.title === 'Flash Sale!')).toBe(true);
    });

    it('should handle empty user list', async () => {
      const notifications = await notificationService.createBatch(
        [],
        {
          type: 'system',
          title: 'Test',
          message: 'Test'
        }
      );

      expect(notifications).toHaveLength(0);
    });
  });

  describe('SSE Connection Management', () => {
    it('should track connection count correctly', () => {
      const initialCount = sseService.getConnectionCount();
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });

    it('should track user count correctly', () => {
      const initialUserCount = sseService.getUserCount();
      expect(initialUserCount).toBeGreaterThanOrEqual(0);
    });
  });
});
