import { Queue } from 'bullmq';
import redis from '../config/redis';
import { isRedisAvailable } from '../config/redis';

// Email job interface
export interface EmailJobData {
  to: string;
  subject: string;
  template: 'orderStatusUpdate' | 'pointsEarned' | 'flashSaleAlert' | 'welcome' | 'general';
  data: Record<string, any>;
}

// Notification job interface
export interface NotificationJobData {
  userId: string;
  type: 'order_status' | 'points_earned' | 'flash_sale' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
}

// Create queues (only if Redis is available)
let emailQueue: Queue<EmailJobData> | null = null;
let notificationQueue: Queue<NotificationJobData> | null = null;

export const initQueues = (): void => {
  if (!isRedisAvailable) {
    console.warn('⚠️  BullMQ queues disabled (Redis not available)');
    return;
  }

  try {
    emailQueue = new Queue<EmailJobData>('email', {
      connection: redis
    });

    notificationQueue = new Queue<NotificationJobData>('notification', {
      connection: redis
    });

    console.log('✅ BullMQ queues initialized');
  } catch (error) {
    console.error('Error initializing BullMQ queues:', error);
  }
};

/**
 * Add email job to queue
 */
export const addEmailJob = async (jobData: EmailJobData): Promise<void> => {
  if (!emailQueue) {
    console.warn('Email queue not available, skipping email job');
    return;
  }

  try {
    await emailQueue.add('send', jobData, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 500 // Keep last 500 failed jobs
    });
  } catch (error) {
    console.error('Error adding email job:', error);
  }
};

/**
 * Add notification job to queue
 */
export const addNotificationJob = async (jobData: NotificationJobData): Promise<void> => {
  if (!notificationQueue) {
    console.warn('Notification queue not available, skipping notification job');
    return;
  }

  try {
    await notificationQueue.add('create', jobData, {
      attempts: 3,
      backoff: {
        type: 'fixed',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 500
    });
  } catch (error) {
    console.error('Error adding notification job:', error);
  }
};

/**
 * Cleanup queues on shutdown
 */
export const cleanupQueues = async (): Promise<void> => {
  try {
    if (emailQueue) {
      await emailQueue.close();
    }
    if (notificationQueue) {
      await notificationQueue.close();
    }
    console.log('✅ BullMQ queues cleanup completed');
  } catch (error) {
    console.error('Error during queue cleanup:', error);
  }
};

export { emailQueue, notificationQueue };
