import prisma from '../lib/prisma';
import redis, { isRedisAvailable } from '../config/redis';

const CACHE_TTL = 3600; // 1 hour

export const recommendationService = {
  // Item-based: Products frequently bought together
  async getSimilarProducts(productId: string, limit = 6) {
    const cacheKey = `rec:similar:${productId}:${limit}`;

    // Check cache only if Redis is available
    if (isRedisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.warn('⚠️  Redis cache read failed, continuing without cache:', error);
      }
    }

    try {
      // Get all purchase activities for this product
      const purchaseActivities = await prisma.userActivity.findMany({
        where: {
          productId,
          activityType: 'PURCHASE'
        },
        select: { userId: true }
      });

      if (purchaseActivities.length === 0) {
        // Fallback to same category
        return this.getFallbackByCategoryForProduct(productId, limit);
      }

      const userIds = purchaseActivities.map(a => a.userId);

      // Get other products these users purchased
      const otherPurchases = await prisma.userActivity.findMany({
        where: {
          userId: { in: userIds },
          activityType: 'PURCHASE',
          productId: { not: productId }
        },
        select: { productId: true }
      });

      // Count co-occurrences
      const cooccurrences: Record<string, number> = {};
      for (const purchase of otherPurchases) {
        if (purchase.productId) {
          cooccurrences[purchase.productId] = (cooccurrences[purchase.productId] || 0) + 1;
        }
      }

      // Sort by count and take top N
      const sorted = Object.entries(cooccurrences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      // If not enough data, fallback to same category
      if (sorted.length < limit) {
        const fallback = await this.getFallbackByCategoryForProduct(productId, limit - sorted.length);
        sorted.push(...fallback.filter((id: string) => !sorted.includes(id)));
      }

      // Cache result only if Redis is available
      if (isRedisAvailable) {
        try {
          await redis.set(cacheKey, JSON.stringify(sorted), 'EX', CACHE_TTL);
        } catch (error) {
          console.warn('⚠️  Redis cache write failed, continuing without caching:', error);
        }
      }

      return sorted;
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      return [];
    }
  },

  async getFallbackByCategoryForProduct(productId: string, limit: number): Promise<string[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true }
    });

    if (!product || !product.categoryId) return [];

    const fallback = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        isAvailable: true
      },
      select: { id: true },
      take: limit
    });

    return fallback.map(p => p.id);
  },

  // User-based: Products for this user
  async getPersonalizedRecommendations(userId: string, limit = 10) {
    const cacheKey = `rec:user:${userId}:${limit}`;

    // Check cache only if Redis is available
    if (isRedisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.warn('⚠️  Redis cache read failed, continuing without cache:', error);
      }
    }

    try {
      // 1. Get user's last 5 interactions
      const recentActivity = await prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { product: { select: { categoryId: true } } }
      });

      if (recentActivity.length === 0) {
        return this.getTrending(limit);
      }

      const recentProductIds = recentActivity.map(a => a.productId);
      const recentCategories = [...new Set(recentActivity.map(a => a.product?.categoryId).filter((id): id is string => Boolean(id)))];

      // 2. Find similar users who interacted with these products
      const similarUsersActivity = await prisma.userActivity.findMany({
        where: {
          productId: { in: recentProductIds.filter((id): id is string => Boolean(id)) },
          userId: { not: userId }
        },
        select: { userId: true }
      });

      // Count activity per user
      const userScores: Record<string, number> = {};
      for (const activity of similarUsersActivity) {
        userScores[activity.userId] = (userScores[activity.userId] || 0) + 1;
      }

      // Top 20 similar users
      const similarUserIds = Object.entries(userScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([id]) => id);

      if (similarUserIds.length === 0) {
        // Fallback to category-based
        return this.getFallbackByCategories(recentCategories, recentProductIds, limit);
      }

      // 3. Get products those users liked
      const recommendedActivity = await prisma.userActivity.findMany({
        where: {
          userId: { in: similarUserIds },
          productId: { notIn: recentProductIds.filter((id): id is string => Boolean(id)) },
          activityType: { in: ['PURCHASE', 'ADD_TO_CART'] }
        },
        select: { productId: true }
      });

      // Score products
      const productScores: Record<string, number> = {};
      for (const activity of recommendedActivity) {
        if (activity.productId) {
          productScores[activity.productId] = (productScores[activity.productId] || 0) + 1;
        }
      }

      let recIds = Object.entries(productScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      // Fallback: Products from categories user likes
      if (recIds.length < limit) {
        const fallback = await this.getFallbackByCategories(
          recentCategories,
          [...recentProductIds, ...recIds],
          limit - recIds.length
        );
        recIds.push(...fallback);
      }

      // Cache result only if Redis is available
      if (isRedisAvailable) {
        try {
          await redis.set(cacheKey, JSON.stringify(recIds), 'EX', CACHE_TTL);
        } catch (error) {
          console.warn('⚠️  Redis cache write failed, continuing without caching:', error);
        }
      }
      return recIds;
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      return this.getTrending(limit);
    }
  },

  async getFallbackByCategories(categoryIds: string[], excludeProductIds: string[], limit: number): Promise<string[]> {
    if (categoryIds.length === 0) return [];

    const fallback = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        id: { notIn: excludeProductIds },
        isAvailable: true
      },
      select: { id: true },
      take: limit
    });

    return fallback.map(p => p.id);
  },

  // Trending: Most purchased recently
  async getTrending(limit = 10) {
    const cacheKey = `rec:trending:${limit}`;

    // Check cache only if Redis is available
    if (isRedisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.warn('⚠️  Redis cache read failed, continuing without cache:', error);
      }
    }

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const trending = await prisma.userActivity.findMany({
        where: {
          activityType: 'PURCHASE',
          createdAt: { gte: sevenDaysAgo }
        },
        select: { productId: true }
      });

      // Count purchases per product
      const productCounts: Record<string, number> = {};
      for (const activity of trending) {
        if (activity.productId) {
          productCounts[activity.productId] = (productCounts[activity.productId] || 0) + 1;
        }
      }

      let productIds = Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      // Fallback if no sales recently
      if (productIds.length < limit) {
        const fallback = await prisma.product.findMany({
          where: {
            id: { notIn: productIds },
            isAvailable: true,
            isFeatured: true
          },
          select: { id: true },
          take: limit - productIds.length
        });

        productIds.push(...fallback.map(p => p.id));
      }

      // Cache result only if Redis is available
      if (isRedisAvailable) {
        try {
          await redis.set(cacheKey, JSON.stringify(productIds), 'EX', CACHE_TTL);
        } catch (error) {
          console.warn('⚠️  Redis cache write failed, continuing without caching:', error);
        }
      }

      return productIds;
    } catch (error) {
      console.error('Error in getTrending:', error);
      return [];
    }
  }
};
