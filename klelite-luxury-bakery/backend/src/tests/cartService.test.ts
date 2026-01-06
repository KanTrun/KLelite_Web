import { cartService, AddToCartDTO, UpdateCartItemDTO } from '../services/cartService';
import prisma from '../lib/prisma';
import { Cart, CartItem } from '@prisma/client';

// Mock the entire prisma client
jest.mock('../lib/prisma', () => ({
  cart: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  cartItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
}));

const mockProduct = {
  id: 'prod1',
  name: 'Test Product',
  price: 50,
  images: [],
  // other product fields
};

const mockCartItem: CartItem = {
  id: 'item1',
  cartId: 'cart1',
  productId: 'prod1',
  quantity: 1,
  price: 50,
  size: 'Small',
  customization: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCart: Cart = {
  id: 'cart1',
  userId: 'user1',
  totalItems: 1,
  totalPrice: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return an existing cart', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [{ ...mockCartItem, product: mockProduct }],
      });

      const result = await cartService.getCart('user1');

      expect(prisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          include: expect.any(Object),
        })
      );
      expect(prisma.cart.create).not.toHaveBeenCalled();
      expect(result.userId).toBe('user1');
      expect(result.items.length).toBe(1);
    });

    it('should create a new cart if none exists', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cart.create as jest.Mock).mockResolvedValue({ ...mockCart, items: [] });

      const result = await cartService.getCart('user2');

      expect(prisma.cart.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user2' },
        })
      );
      expect(prisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userId: 'user2' },
        })
      );
      expect(result.userId).toBe('user2');
      expect(result.items).toEqual([]);
    });
  });

  describe('addToCart', () => {
    it('should add a new item to cart if not existing', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cartItem.findMany as jest.Mock).mockResolvedValue([]); // No existing items
      (prisma.cartItem.create as jest.Mock).mockResolvedValue(mockCartItem);
      // Mock recalculateCart return value
      (prisma.cart.update as jest.Mock).mockResolvedValue({
        ...mockCart,
        totalItems: 1,
        totalPrice: 50,
        items: [{ ...mockCartItem, product: mockProduct }],
      });

      const addData: AddToCartDTO = {
        userId: 'user1',
        productId: 'prod1',
        quantity: 1,
        size: 'Small',
      };

      const result = await cartService.addToCart(addData);

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod1' } })
      );
      expect(prisma.cartItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cartId: mockCart.id,
            productId: addData.productId,
            size: addData.size,
          },
        })
      );
      expect(prisma.cartItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cartId: mockCart.id,
            productId: addData.productId,
            quantity: addData.quantity,
            price: mockProduct.price,
          }),
        })
      );
      expect(result.totalItems).toBe(1);
      expect(result.totalPrice).toBe(50);
    });

    it('should update quantity if item already exists', async () => {
      const existingCartItem = { ...mockCartItem, quantity: 1 };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cartItem.findMany as jest.Mock).mockResolvedValue([existingCartItem]);
      (prisma.cartItem.update as jest.Mock).mockResolvedValue({
        ...existingCartItem,
        quantity: existingCartItem.quantity + 2,
      });
      // Mock recalculateCart return value
      (prisma.cart.update as jest.Mock).mockResolvedValue({
        ...mockCart,
        totalItems: 3,
        totalPrice: 150,
        items: [{ ...mockCartItem, quantity: 3, product: mockProduct }],
      });

      const addData: AddToCartDTO = {
        userId: 'user1',
        productId: 'prod1',
        quantity: 2,
        size: 'Small',
      };

      const result = await cartService.addToCart(addData);

      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + addData.quantity },
        })
      );
      expect(result.totalItems).toBe(3);
      expect(result.totalPrice).toBe(150);
    });

    it('should throw error if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const addData: AddToCartDTO = {
        userId: 'user1',
        productId: 'prod_nonexistent',
        quantity: 1,
      };

      await expect(cartService.addToCart(addData)).rejects.toThrow('Product not found');
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      (prisma.cartItem.update as jest.Mock).mockResolvedValue({ ...mockCartItem, quantity: 3 });
      // Mock recalculateCart return value
      (prisma.cart.update as jest.Mock).mockResolvedValue({
        ...mockCart,
        totalItems: 3,
        totalPrice: 150,
        items: [{ ...mockCartItem, quantity: 3, product: mockProduct }],
      });

      const result = await cartService.updateCartItem('item1', 3);

      expect(prisma.cartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item1' },
          data: { quantity: 3 },
        })
      );
      expect(result.totalItems).toBe(3);
      expect(result.totalPrice).toBe(150);
    });

    it('should remove item if quantity is 0 or less', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem); // for removeCartItem
      (prisma.cartItem.delete as jest.Mock).mockResolvedValue(mockCartItem);
      // Mock recalculateCart return value
      (prisma.cart.update as jest.Mock).mockResolvedValue({ ...mockCart, totalItems: 0, totalPrice: 0, items: [] });

      const result = await cartService.updateCartItem('item1', 0);

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('removeCartItem', () => {
    it('should remove a cart item', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(mockCartItem);
      (prisma.cartItem.delete as jest.Mock).mockResolvedValue(mockCartItem);
      // Mock recalculateCart return value
      (prisma.cart.update as jest.Mock).mockResolvedValue({ ...mockCart, totalItems: 0, totalPrice: 0, items: [] });

      const result = await cartService.removeCartItem('item1');

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
      expect(result?.totalItems).toBe(0);
    });

    it('should return null if item not found', async () => {
      (prisma.cartItem.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await cartService.removeCartItem('nonexistent_item');

      expect(result).toBeNull();
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should clear all items from a user\'s cart', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(mockCart);
      (prisma.cartItem.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.cart.update as jest.Mock).mockResolvedValue({ ...mockCart, totalItems: 0, totalPrice: 0 });

      await cartService.clearCart('user1');

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({ where: { userId: 'user1' } });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: mockCart.id } });
      expect(prisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockCart.id },
          data: { totalItems: 0, totalPrice: 0 },
        })
      );
    });

    it('should do nothing if cart not found', async () => {
      (prisma.cart.findUnique as jest.Mock).mockResolvedValue(null);

      await cartService.clearCart('nonexistent_user');

      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(prisma.cart.update).not.toHaveBeenCalled();
    });
  });

  describe('recalculateCart', () => {
    it('should correctly recalculate totals for an existing cart', async () => {
      const items = [
        { ...mockCartItem, id: 'itemA', quantity: 2, price: 10 },
        { ...mockCartItem, id: 'itemB', quantity: 3, price: 20 },
      ];
      (prisma.cartItem.findMany as jest.Mock).mockResolvedValue(items);
      (prisma.cart.update as jest.Mock).mockResolvedValue({
        ...mockCart,
        totalItems: 5,
        totalPrice: 80,
        items: items.map(item => ({...item, product: mockProduct})),
      });

      const result = await cartService.recalculateCart('cart1');

      expect(prisma.cartItem.findMany).toHaveBeenCalledWith({ where: { cartId: 'cart1' } });
      expect(prisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cart1' },
          data: { totalItems: 5, totalPrice: 80 },
        })
      );
      expect(result.totalItems).toBe(5);
      expect(result.totalPrice).toBe(80);
    });
  });
});
