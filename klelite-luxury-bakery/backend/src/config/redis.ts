import Redis from 'ioredis';
import { config } from './index';

// Create Redis client instance with optional connection
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: () => null, // Don't retry
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect until explicitly called
  enableOfflineQueue: false
});

let isRedisAvailable = false;

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis client connected');
  isRedisAvailable = true;
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
  isRedisAvailable = true;
});

redis.on('error', () => {
  isRedisAvailable = false;
});

redis.on('close', () => {
  if (isRedisAvailable) {
    console.log('⚠️  Redis client connection closed');
  }
  isRedisAvailable = false;
});

// Export function to initialize Redis connection
export const initRedis = async (): Promise<void> => {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 2000)
    );
    await Promise.race([redis.connect(), timeout]);
  } catch (error) {
    console.warn('⚠️  Redis is not available. Some features (flash sales, recommendations caching) may be disabled.');
    console.warn('   To enable Redis features, please start Redis server on', `${config.redis.host}:${config.redis.port}`);
    isRedisAvailable = false;
    try {
      await redis.disconnect(false);
    } catch (e) {
      // Ignore
    }
  }
};

export { isRedisAvailable };
export default redis;
