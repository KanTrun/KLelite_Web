
import { recommendationService } from '../services/recommendationService';
import UserActivity from '../models/UserActivity';
import Product from '../models/Product';
import mongoose from 'mongoose';
import redis from '../config/redis'; // Added Redis import

// Mock external dependencies
jest.mock('../models/UserActivity', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('../models/Product', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    find: jest.fn(),
  },
}));

// Mock the redis module to prevent actual connections during tests
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => null), // Simulate cache miss by default
    set: jest.fn(), // Mock set to do nothing
    on: jest.fn(), // Mock 'on' to prevent event listener errors
    quit: jest.fn(), // Mock quit to prevent open handles
  },
}));

describe('Recommendation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSimilarProducts', () => {
    it('should return similar products based on user activity', async () => {
      const productId = new mongoose.Types.ObjectId().toHexString(); // Use a valid ObjectId string
      const mockSimilarIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
      (UserActivity.aggregate as jest.Mock).mockResolvedValue([
        { _id: mockSimilarIds[0] },
        { _id: mockSimilarIds[1] },
      ]);

      const result = await recommendationService.getSimilarProducts(productId);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockSimilarIds[0]);
    });

    it('should fallback to category if not enough data', async () => {
      const productId = new mongoose.Types.ObjectId().toHexString(); // Use a valid ObjectId string
      (UserActivity.aggregate as jest.Mock).mockResolvedValue([]);
      (Product.findById as jest.Mock).mockResolvedValue({ _id: productId, category: 'CAT1' });

      const mockFallbackIds = [new mongoose.Types.ObjectId()];
      (Product.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ _id: mockFallbackIds[0] }]),
        }),
      });

      const result = await recommendationService.getSimilarProducts(productId);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFallbackIds[0]);
    });
  });

  describe('getTrending', () => {
    it('should return trending products', async () => {
      const mockTrendingIds = [new mongoose.Types.ObjectId()];
      (UserActivity.aggregate as jest.Mock).mockResolvedValue([
        { _id: mockTrendingIds[0] },
      ]);
      // Ensure fallback is not triggered by returning empty from Product.find
      (Product.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await recommendationService.getTrending();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTrendingIds[0]);
    });

    it('should fallback to featured products if no data', async () => {
      (UserActivity.aggregate as jest.Mock).mockResolvedValue([]);

      const mockFallbackIds = [new mongoose.Types.ObjectId()];
      (Product.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ _id: mockFallbackIds[0] }]),
        }),
      });

      const result = await recommendationService.getTrending();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFallbackIds[0]);
    });
  });
});
