import { Response } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import { INotification } from '../models/Notification';

// Map of userId to array of SSE response objects
const connections = new Map<string, Response[]>();

// Maximum SSE connections per user (prevent memory leak)
const MAX_CONNECTIONS_PER_USER = 5;

// Redis Pub/Sub instances for multi-server support
const redisSub = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: () => null,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false
});

const redisPub = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: () => null,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false
});

let isRedisPubSubAvailable = false;

// Initialize Redis Pub/Sub
export const initSseRedis = async (): Promise<void> => {
  try {
    await Promise.all([
      redisSub.connect(),
      redisPub.connect()
    ]);

    // Subscribe to notifications channel
    await redisSub.subscribe('notifications');

    // Listen for Redis messages
    redisSub.on('message', (channel: string, message: string) => {
      if (channel === 'notifications') {
        try {
          const { userId, notification } = JSON.parse(message);
          sendToUser(userId, notification);
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      }
    });

    isRedisPubSubAvailable = true;
    console.log('✅ SSE Redis Pub/Sub initialized');
  } catch (error) {
    console.warn('⚠️  SSE Redis Pub/Sub not available. Notifications will work in single-server mode only.');
    isRedisPubSubAvailable = false;
  }
};

/**
 * Add a new SSE connection for a user
 * Limits connections to MAX_CONNECTIONS_PER_USER to prevent memory leaks
 */
export const addConnection = (userId: string, res: Response): void => {
  if (!connections.has(userId)) {
    connections.set(userId, []);
  }

  const userConnections = connections.get(userId)!;

  // If max connections reached, close oldest connection
  if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
    const oldestConnection = userConnections.shift();
    if (oldestConnection) {
      oldestConnection.end();
      console.log(`SSE connection limit reached for user ${userId}. Closed oldest connection.`);
    }
  }

  userConnections.push(res);

  console.log(`SSE connection added for user ${userId}. Total connections: ${userConnections.length}`);

  // Remove connection on disconnect
  res.on('close', () => {
    const connections = getConnections(userId);
    if (connections) {
      const index = connections.indexOf(res);
      if (index > -1) {
        connections.splice(index, 1);
        console.log(`SSE connection closed for user ${userId}. Remaining: ${connections.length}`);

        // Cleanup if no more connections
        if (connections.length === 0) {
          removeUser(userId);
        }
      }
    }
  });
};

/**
 * Get all SSE connections for a user
 */
export const getConnections = (userId: string): Response[] | undefined => {
  return connections.get(userId);
};

/**
 * Remove all connections for a user
 */
export const removeUser = (userId: string): void => {
  connections.delete(userId);
  console.log(`Removed all SSE connections for user ${userId}`);
};

/**
 * Publish notification to Redis Pub/Sub (for multi-server)
 */
export const publish = async (userId: string, notification: INotification): Promise<void> => {
  if (isRedisPubSubAvailable) {
    try {
      await redisPub.publish('notifications', JSON.stringify({
        userId,
        notification
      }));
    } catch (error) {
      console.error('Error publishing notification to Redis:', error);
      // Fallback to local delivery
      sendToUser(userId, notification);
    }
  } else {
    // Single-server mode: deliver directly
    sendToUser(userId, notification);
  }
};

/**
 * Send notification to all SSE connections for a user
 */
export const sendToUser = (userId: string, data: any): void => {
  const userConnections = connections.get(userId);

  if (userConnections && userConnections.length > 0) {
    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const res of userConnections) {
      try {
        res.write(message);
      } catch (error) {
        console.error(`Error sending SSE to user ${userId}:`, error);
      }
    }

    console.log(`Sent notification to ${userConnections.length} connection(s) for user ${userId}`);
  }
};

/**
 * Get total number of active connections
 */
export const getConnectionCount = (): number => {
  let total = 0;
  for (const userConnections of connections.values()) {
    total += userConnections.length;
  }
  return total;
};

/**
 * Get number of connected users
 */
export const getUserCount = (): number => {
  return connections.size;
};

/**
 * Cleanup on server shutdown
 */
export const cleanup = async (): Promise<void> => {
  try {
    // Close all SSE connections
    for (const userConnections of connections.values()) {
      for (const res of userConnections) {
        res.end();
      }
    }
    connections.clear();

    // Disconnect Redis Pub/Sub
    if (isRedisPubSubAvailable) {
      await redisSub.unsubscribe('notifications');
      await redisSub.quit();
      await redisPub.quit();
    }

    console.log('✅ SSE service cleanup completed');
  } catch (error) {
    console.error('Error during SSE cleanup:', error);
  }
};

export default {
  initSseRedis,
  addConnection,
  getConnections,
  removeUser,
  publish,
  sendToUser,
  getConnectionCount,
  getUserCount,
  cleanup
};
