import cron from 'node-cron';
import Product from '../models/Product';
import UserActivity from '../models/UserActivity';
import mongoose from 'mongoose';
import redis, { isRedisAvailable } from '../config/redis';

// Run daily at 3 AM
const scheduleRecommendations = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('Starting recommendation computation job...');

    try {
      // 1. Calculate Trending Products
      const trending = await UserActivity.aggregate([
        { $match: {
          activityType: 'purchase',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }},
        { $group: { _id: '$productId', count: { $sum: 1 } }},
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]);

      const trendingIds = trending.map(t => t._id);

      // Cache trending products only if Redis is available
      if (isRedisAvailable) {
        try {
          await redis.set('rec:trending:20', JSON.stringify(trendingIds), 'EX', 86400); // 24 hours
          console.log(`Computed and cached ${trendingIds.length} trending products`);
        } catch (error) {
          console.warn('⚠️  Failed to cache trending products (Redis unavailable):', error);
          console.log(`Computed ${trendingIds.length} trending products (not cached)`);
        }
      } else {
        console.log(`Computed ${trendingIds.length} trending products (Redis unavailable, not cached)`);
      }

      // 2. Pre-compute Item-based Similarity (Co-occurrence)
      // This is heavy, so we might want to store it in a dedicated collection
      // For now, let's just clean up old activity logs to keep queries fast

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await UserActivity.deleteMany({ createdAt: { $lt: ninetyDaysAgo } });

      console.log(`Cleaned up ${result.deletedCount} old activity logs`);

    } catch (error) {
      console.error('Error in recommendation job:', error);
    }
  });
};

export default scheduleRecommendations;
