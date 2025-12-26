import Redis from 'ioredis';
import { config } from './index';

// Create Redis client instance
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis client connected');
});

redis.on('ready', () => {
  console.log('✅ Redis client ready');
});

redis.on('error', (err: Error) => {
  console.error('❌ Redis client error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️  Redis client connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

export default redis;
