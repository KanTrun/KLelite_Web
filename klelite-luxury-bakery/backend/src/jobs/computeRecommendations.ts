import cron from 'node-cron';
import prisma from '../lib/prisma';
import redis, { isRedisAvailable } from '../config/redis';

// Run daily at 3 AM
const scheduleRecommendations = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('Starting recommendation computation job...');

    try {
      // 1. Calculate Trending Products (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const purchases = await prisma.userActivity.findMany({
        where: {
          activityType: 'PURCHASE',
          createdAt: { gte: sevenDaysAgo }
        },
        select: { productId: true }
      });

      // Group and count in JS
      const productCounts = purchases.reduce((acc, activity) => {
        if (activity.productId) {
          acc[activity.productId] = (acc[activity.productId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Sort by count and get top 20
      const trendingIds = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id);

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

      // 2. Clean up old activity logs (older than 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await prisma.userActivity.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } }
      });

      console.log(`Cleaned up ${result.count} old activity logs`);

    } catch (error) {
      console.error('Error in recommendation job:', error);
    }
  });
};

export default scheduleRecommendations;
