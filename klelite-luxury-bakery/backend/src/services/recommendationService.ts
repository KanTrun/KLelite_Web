import mongoose from 'mongoose';
import UserActivity from '../models/UserActivity';
import Product from '../models/Product';

const { ObjectId } = mongoose.Types;

export const recommendationService = {
  // Item-based: Products frequently bought together
  async getSimilarProducts(productId: string, limit = 6) {
    try {
      const cooccurrences = await UserActivity.aggregate([
        { $match: { productId: new mongoose.Types.ObjectId(productId), activityType: 'purchase' } },
        { $lookup: {
          from: 'useractivities',
          let: { userId: '$userId' },
          pipeline: [
            { $match: {
              $expr: { $eq: ['$userId', '$$userId'] },
              activityType: 'purchase',
              productId: { $ne: new mongoose.Types.ObjectId(productId) }
            }}
          ],
          as: 'otherPurchases'
        }},
        { $unwind: '$otherPurchases' },
        { $group: { _id: '$otherPurchases.productId', count: { $sum: 1 } }},
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const productIds = cooccurrences.map(c => c._id);

      // If not enough data, fallback to same category
      if (productIds.length < limit) {
        const product = await Product.findById(productId);
        if (product) {
          const fallback = await Product.find({
            category: product.category,
            _id: { $ne: product._id, $nin: productIds },
            isAvailable: true
          }).limit(limit - productIds.length).select('_id');

          productIds.push(...fallback.map(p => p._id));
        }
      }

      return productIds;
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      return [];
    }
  },

  // User-based: Products for this user
  async getPersonalizedRecommendations(userId: string, limit = 10) {
    try {
      // 1. Get user's last 5 interactions
      const recentActivity = await UserActivity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('productId');

      if (recentActivity.length === 0) {
        return this.getTrending(limit);
      }

      const recentProductIds = recentActivity.map(a => a.productId._id);
      const recentCategories = [...new Set(recentActivity.map(a => (a.productId as any).category))];

      // 2. Find similar users who interacted with these products
      const similarUsers = await UserActivity.aggregate([
        { $match: {
          productId: { $in: recentProductIds },
          userId: { $ne: new mongoose.Types.ObjectId(userId) }
        }},
        { $group: { _id: '$userId', score: { $sum: 1 } }},
        { $sort: { score: -1 } },
        { $limit: 20 }
      ]);

      const similarUserIds = similarUsers.map(u => u._id);

      // 3. Get products those users liked
      const recommendations = await UserActivity.aggregate([
        { $match: {
          userId: { $in: similarUserIds },
          productId: { $nin: recentProductIds }, // Exclude what user already saw
          activityType: { $in: ['purchase', 'cart_add', 'view'] }
        }},
        { $group: { _id: '$productId', score: { $sum: 1 } }},
        { $sort: { score: -1 } },
        { $limit: limit }
      ]);

      let recIds = recommendations.map(r => r._id);

      // Fallback: Products from categories user likes
      if (recIds.length < limit) {
        const fallback = await Product.find({
          category: { $in: recentCategories },
          _id: { $nin: [...recentProductIds, ...recIds] },
          isAvailable: true
        }).limit(limit - recIds.length).select('_id');

        recIds.push(...fallback.map(p => p._id));
      }

      return recIds;
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      return this.getTrending(limit);
    }
  },

  // Trending: Most purchased recently
  async getTrending(limit = 10) {
    try {
      const trending = await UserActivity.aggregate([
        { $match: {
          activityType: 'purchase',
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }},
        { $group: { _id: '$productId', count: { $sum: 1 } }},
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      const productIds = trending.map(t => t._id);

      // Fallback if no sales recently
      if (productIds.length < limit) {
        const fallback = await Product.find({
          _id: { $nin: productIds },
          isAvailable: true,
          isFeatured: true
        }).limit(limit - productIds.length).select('_id');

        productIds.push(...fallback.map(p => p._id));
      }

      return productIds;
    } catch (error) {
      console.error('Error in getTrending:', error);
      return [];
    }
  }
};
