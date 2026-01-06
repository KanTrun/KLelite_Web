// Mock asyncHandler first
jest.mock('../utils/asyncHandler', () => (fn: any) => fn);

import { loyaltyService } from '../services/loyalty-service';
import LoyaltyAccount from '../models/LoyaltyAccount';
import * as loyaltyController from '../controllers/loyaltyController';
import { updateOrderStatus, createOrder } from '../controllers/orderController';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import User from '../models/User';

// Mock the models
jest.mock('../models/LoyaltyAccount');
jest.mock('../models/Order');
jest.mock('../models/Cart');
jest.mock('../models/Product');
jest.mock('../models/User');
jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    orderConfirmation: jest.fn().mockReturnValue({ subject: 'test', html: 'test' }),
  },
}));

describe('Loyalty Points System', () => {
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Tier Calculation', () => {
    test('should return correct tier based on lifetime points', () => {
      expect(loyaltyService.calculateTier(0)).toBe('bronze');
      expect(loyaltyService.calculateTier(5000)).toBe('silver');
      expect(loyaltyService.calculateTier(20000)).toBe('gold');
      expect(loyaltyService.calculateTier(50000)).toBe('platinum');
    });

    test('should return correct multiplier for each tier', () => {
      expect(loyaltyService.getTierMultiplier('bronze')).toBe(1.0);
      expect(loyaltyService.getTierMultiplier('silver')).toBe(1.2);
      expect(loyaltyService.getTierMultiplier('gold')).toBe(1.5);
      expect(loyaltyService.getTierMultiplier('platinum')).toBe(2.0);
    });
  });

  describe('Points Earning Logic', () => {
    test('should calculate points correctly and update account', async () => {
      const mockAccount: any = {
        userId: 'user1',
        currentPoints: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(LoyaltyAccount, 'findOne').mockResolvedValue(mockAccount);

      const points = await loyaltyService.earnPoints('user1', 'order1', 100000);

      expect(points).toBe(100); // 100000 / 1000 * 1.0
      expect(mockAccount.currentPoints).toBe(100);
      expect(mockAccount.lifetimePoints).toBe(100);
      expect(mockAccount.history[0].expiresAt).toBeDefined();
    });
  });

  describe('Points Redemption Logic', () => {
    test('should throw error if insufficient points', async () => {
      const mockAccount: any = {
        currentPoints: 50,
      };
      jest.spyOn(LoyaltyAccount, 'findOne').mockResolvedValue(mockAccount);

      await expect(loyaltyService.redeemPoints('user1', 'order1', 100))
        .rejects.toThrow('Insufficient points');
    });

    test('should deduct points and return discount amount', async () => {
      const mockAccount: any = {
        currentPoints: 200,
        history: [],
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(LoyaltyAccount, 'findOne').mockResolvedValue(mockAccount);

      const discount = await loyaltyService.redeemPoints('user1', 'order1', 100);

      expect(discount).toBe(1000); // 100 * 10
      expect(mockAccount.currentPoints).toBe(100);
    });
  });

  describe('Controller: validateRedemption', () => {
    test('should return valid discount info', async () => {
      const mockReq: any = {
        user: { _id: 'user1' },
        body: { points: 100 },
      };
      const mockAccount: any = {
        currentPoints: 200,
        toObject: jest.fn().mockReturnThis(),
      };
      jest.spyOn(LoyaltyAccount, 'findOne').mockResolvedValue(mockAccount);

      await loyaltyController.validateRedemption(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          valid: true,
          discount: 1000,
        }),
      }));
    });
  });

  describe('Integration: Points Earning on Delivery', () => {
    test('should call earnPoints when order status updated to delivered', async () => {
      const mockOrder = {
        _id: 'order1',
        user: 'user1',
        total: 100000,
        orderStatus: 'shipping',
        payment: { method: 'cod', status: 'pending', paidAt: null }, // Corrected mock for nested payment object
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
      };
      jest.spyOn(Order, 'findById').mockResolvedValue(mockOrder as any);
      const earnPointsSpy = jest.spyOn(loyaltyService, 'earnPoints').mockResolvedValue(100);

      const mockReq: any = { params: { id: 'order1' }, body: { status: 'delivered' } };
      await updateOrderStatus(mockReq, mockRes, mockNext);

      expect(earnPointsSpy).toHaveBeenCalledWith('user1', 'order1', 100000);
    });
  });

  describe('Integration: Points Redemption at Checkout', () => {
    test('should call redeemPoints during order creation', async () => {
      const mockUser = { _id: 'user1', firstName: 'Test' };
      const mockCart = {
        user: 'user1',
        items: [
          { product: 'prod1', quantity: 1, price: 50000 }
        ],
        save: jest.fn().mockResolvedValue(true),
      };
      const mockProduct = { _id: 'prod1', name: 'Cake', stock: 10, isAvailable: true };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
      jest.spyOn(Cart, 'findOne').mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve(mockCart)),
      } as any);
      jest.spyOn(Product, 'find').mockResolvedValue([mockProduct] as any);
      jest.spyOn(Product, 'findByIdAndUpdate').mockResolvedValue(true as any);
      jest.spyOn(Order, 'create').mockResolvedValue({ _id: 'order1', orderNumber: 'ORD001' } as any);

      const redeemPointsSpy = jest.spyOn(loyaltyService, 'redeemPoints').mockResolvedValue(1000);

      const mockReq: any = {
        user: { _id: 'user1' },
        body: {
          shippingAddress: { city: 'Hồ Chí Minh' },
          paymentMethod: 'cod',
          redeemPoints: 100,
        },
      };

      await createOrder(mockReq, mockRes, mockNext);

      expect(redeemPointsSpy).toHaveBeenCalledWith('user1', 'order1', 100);
    });
  });

  describe('Points Expiration', () => {
    test('should expire old points correctly', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const mockAccount: any = {
        currentPoints: 100,
        history: [
          { type: 'earn', amount: 100, expiresAt: pastDate }
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(LoyaltyAccount, 'find').mockResolvedValue([mockAccount]);

      const result = await loyaltyService.expirePoints();

      expect(result.expired).toBe(100);
      expect(mockAccount.currentPoints).toBe(0);
    });
  });
});
