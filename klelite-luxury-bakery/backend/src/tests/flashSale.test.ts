// Mock asyncHandler and Redis
jest.mock('../utils/asyncHandler', () => (fn: any) => fn);
jest.mock('../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  decrby: jest.fn(),
  incrby: jest.fn(),
  expire: jest.fn(),
  pipeline: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  })),
}));

import flashSaleService from '../services/flashSaleService';
import { FlashSale, StockReservation } from '../models';
import redis from '../config/redis';
import mongoose from 'mongoose';
import AppError from '../utils/AppError';

// Mock the models
jest.mock('../models/FlashSale');
jest.mock('../models/StockReservation');

describe('Flash Sale System', () => {
  let mockFlashSale: any;
  let mockReservation: any;

  const saleId = new mongoose.Types.ObjectId().toString();
  const productId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();

    mockFlashSale = {
      _id: saleId,
      name: 'Summer Sale',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() + 3600000), // 1 hour from now
      status: 'active',
      earlyAccessMinutes: 30,
      earlyAccessTiers: ['gold', 'platinum'],
      products: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          stockLimit: 10,
          perUserLimit: 2,
          soldCount: 0,
        },
      ],
    };

    mockReservation = {
      _id: new mongoose.Types.ObjectId().toString(),
      flashSaleId: saleId,
      productId: productId,
      userId: userId,
      quantity: 1,
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };
  });

  describe('reserveStock', () => {
    test('should successfully reserve stock', async () => {
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);
      (redis.get as jest.Mock).mockResolvedValue('0'); // User purchased
      (redis.decrby as jest.Mock).mockResolvedValue(9); // Remaining stock
      (StockReservation.create as jest.Mock).mockResolvedValue(mockReservation);

      const result = await flashSaleService.reserveStock(saleId, productId, userId, 1);

      expect(result).toBeDefined();
      expect(redis.decrby).toHaveBeenCalled();
      expect(StockReservation.create).toHaveBeenCalled();
    });

    test('should throw error if product is sold out', async () => {
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);
      (redis.get as jest.Mock).mockResolvedValue('0');
      (redis.decrby as jest.Mock).mockResolvedValue(-1); // Oversold

      await expect(flashSaleService.reserveStock(saleId, productId, userId, 1))
        .rejects.toThrow('Product sold out');

      expect(redis.incrby).toHaveBeenCalled(); // Rollback
    });

    test('should throw error if user purchase limit exceeded', async () => {
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);
      (redis.get as jest.Mock).mockResolvedValue('2'); // Already bought 2

      await expect(flashSaleService.reserveStock(saleId, productId, userId, 1))
        .rejects.toThrow('Purchase limit exceeded');
    });

    test('should restrict early access for non-eligible tiers', async () => {
      // Set start time to 15 mins in future (during early access window)
      mockFlashSale.startTime = new Date(Date.now() + 15 * 60 * 1000);
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);

      await expect(flashSaleService.reserveStock(saleId, productId, userId, 1, 'bronze'))
        .rejects.toThrow(/Early access only/);
    });

    test('should allow early access for eligible tiers', async () => {
      mockFlashSale.startTime = new Date(Date.now() + 15 * 60 * 1000);
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);
      (redis.get as jest.Mock).mockResolvedValue('0');
      (redis.decrby as jest.Mock).mockResolvedValue(5);
      (StockReservation.create as jest.Mock).mockResolvedValue(mockReservation);

      const result = await flashSaleService.reserveStock(saleId, productId, userId, 1, 'gold');
      expect(result).toBeDefined();
    });
  });

  describe('confirmReservation', () => {
    test('should confirm reservation and update counts', async () => {
      (StockReservation.findById as jest.Mock).mockResolvedValue(mockReservation);
      (FlashSale.findById as jest.Mock).mockResolvedValue(mockFlashSale);
      (FlashSale.updateOne as jest.Mock).mockResolvedValue({ modifiedCount: 1 });

      await flashSaleService.confirmReservation(mockReservation._id);

      expect(mockReservation.status).toBe('completed');
      expect(mockReservation.save).toHaveBeenCalled();
      expect(FlashSale.updateOne).toHaveBeenCalled();
      expect(redis.incrby).toHaveBeenCalled(); // User purchase count
    });

    test('should throw error if reservation already processed', async () => {
      mockReservation.status = 'completed';
      (StockReservation.findById as jest.Mock).mockResolvedValue(mockReservation);

      await expect(flashSaleService.confirmReservation(mockReservation._id))
        .rejects.toThrow('Reservation already processed');
    });
  });

  describe('releaseReservation', () => {
    test('should return stock to Redis and mark as expired', async () => {
      (StockReservation.findById as jest.Mock).mockResolvedValue(mockReservation);

      await flashSaleService.releaseReservation(mockReservation._id);

      expect(redis.incrby).toHaveBeenCalled(); // Return stock
      expect(mockReservation.status).toBe('expired');
      expect(mockReservation.save).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredReservations', () => {
    test('should cleanup multiple expired reservations', async () => {
      const expiredReservations = [
        { ...mockReservation, _id: 'res1' },
        { ...mockReservation, _id: 'res2' },
      ];
      (StockReservation.find as jest.Mock).mockResolvedValue(expiredReservations);
      (StockReservation.findById as jest.Mock)
        .mockResolvedValueOnce(expiredReservations[0])
        .mockResolvedValueOnce(expiredReservations[1]);

      await flashSaleService.cleanupExpiredReservations();

      expect(StockReservation.find).toHaveBeenCalled();
      expect(redis.incrby).toHaveBeenCalledTimes(2);
    });
  });
});
