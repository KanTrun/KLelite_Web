import { orderService, CreateOrderDTO, CreateOrderItemDTO } from '../services/orderService';
import prisma from '../lib/prisma';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

// Mock the entire prisma client
jest.mock('../lib/prisma', () => ({
  order: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(prisma)),
}));

const mockOrderItem: CreateOrderItemDTO = {
  productId: 'prod1',
  quantity: 2,
  price: 50,
  name: 'Test Product Item',
  image: 'http://example.com/item.jpg',
  size: 'Large',
  customization: { notes: 'No sugar' },
};

const mockOrder: Order = {
  id: 'order1',
  orderNumber: 'ORD-12345',
  userId: 'user1',
  shippingFullName: 'John Doe',
  shippingPhone: '1234567890',
  shippingAddress: '123 Main St',
  shippingWard: 'Ward A',
  shippingDistrict: 'District X',
  shippingCity: 'City Y',
  paymentMethod: PaymentMethod.COD,
  paymentStatus: PaymentStatus.PENDING,
  orderStatus: OrderStatus.PENDING,
  subtotal: 100,
  shippingFee: 10,
  discount: 5,
  total: 105,
  note: 'Deliver quickly',
  deliveryDate: new Date(),
  deliveryTimeSlot: 'Morning',
  isGift: false,
  giftMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  paidAt: null,
  deliveredAt: null,
  cancelledAt: null,
  voucherCode: null,
};

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a new order and update product stock', async () => {
      (prisma.order.create as jest.Mock).mockResolvedValue({
        ...mockOrder,
        items: [{ ...mockOrderItem, id: 'item1', orderId: 'order1', total: mockOrderItem.price * mockOrderItem.quantity }],
      });
      (prisma.product.update as jest.Mock).mockResolvedValue({});

      const newOrderData: CreateOrderDTO = {
        userId: 'user1',
        items: [mockOrderItem],
        shippingFullName: 'John Doe',
        shippingPhone: '1234567890',
        shippingAddress: '123 Main St',
        shippingWard: 'Ward A',
        shippingDistrict: 'District X',
        shippingCity: 'City Y',
        paymentMethod: PaymentMethod.COD,
        subtotal: 100,
        shippingFee: 10,
        discount: 5,
        total: 105,
      };

      const result = await orderService.createOrder(newOrderData);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user1',
            orderNumber: expect.any(String),
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  productId: mockOrderItem.productId,
                  quantity: mockOrderItem.quantity,
                  price: mockOrderItem.price,
                }),
              ]),
            },
          }),
          include: { items: true },
        })
      );
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockOrderItem.productId },
          data: {
            stock: { decrement: mockOrderItem.quantity },
            sold: { increment: mockOrderItem.quantity },
          },
        })
      );
      expect(result.userId).toBe('user1');
      expect(result.orderNumber).toBeDefined();
      expect((result as any).items[0].productId).toBe(mockOrderItem.productId);
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders with pagination', async () => {
      const mockOrdersList = [{ ...mockOrder, id: 'o1' }, { ...mockOrder, id: 'o2', orderNumber: 'ORD-222' }];
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrdersList);
      (prisma.order.count as jest.Mock).mockResolvedValue(2);

      const result = await orderService.getUserOrders('user1', 1, 10);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user1' },
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        })
      );
      expect(prisma.order.count).toHaveBeenCalledWith({ where: { userId: 'user1' } });
      expect(result.orders).toEqual(mockOrdersList);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });
  });

  describe('getOrderById', () => {
    it('should return an order by ID', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ ...mockOrder, items: [mockOrderItem] });

      const result = await orderService.getOrderById('order1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order1' },
          include: expect.any(Object),
        })
      );
      expect(result).toEqual({ ...mockOrder, items: [mockOrderItem] });
    });

    it('should return null if order not found by ID', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await orderService.getOrderById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status to DELIVERED and set deliveredAt', async () => {
      const deliveredOrder = { ...mockOrder, orderStatus: OrderStatus.DELIVERED, deliveredAt: new Date() };
      (prisma.order.update as jest.Mock).mockResolvedValue(deliveredOrder);

      const result = await orderService.updateOrderStatus('order1', OrderStatus.DELIVERED);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order1' },
          data: expect.objectContaining({
            status: OrderStatus.DELIVERED,
            deliveredAt: expect.any(Date),
          }),
        })
      );
      expect(result.orderStatus).toBe(OrderStatus.DELIVERED);
      expect(result.deliveredAt).toBeInstanceOf(Date);
    });

    it('should update order status to CANCELLED and set cancelledAt', async () => {
      const cancelledOrder = { ...mockOrder, orderStatus: OrderStatus.CANCELLED, cancelledAt: new Date() };
      (prisma.order.update as jest.Mock).mockResolvedValue(cancelledOrder);

      const result = await orderService.updateOrderStatus('order1', OrderStatus.CANCELLED);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order1' },
          data: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            cancelledAt: expect.any(Date),
          }),
        })
      );
      expect(result.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(result.cancelledAt).toBeInstanceOf(Date);
    });

    it('should update payment status to PAID and set paidAt', async () => {
      const paidOrder = { ...mockOrder, paymentStatus: PaymentStatus.PAID, paidAt: new Date() };
      (prisma.order.update as jest.Mock).mockResolvedValue(paidOrder);

      const result = await orderService.updateOrderStatus('order1', OrderStatus.PROCESSING, PaymentStatus.PAID);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order1' },
          data: expect.objectContaining({
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.PAID,
            paidAt: expect.any(Date),
          }),
        })
      );
      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.paidAt).toBeInstanceOf(Date);
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders with pagination and no filters', async () => {
      const mockOrdersList = [{ ...mockOrder, id: 'o1' }, { ...mockOrder, id: 'o2', orderNumber: 'ORD-222' }];
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrdersList);
      (prisma.order.count as jest.Mock).mockResolvedValue(2);

      const result = await orderService.getAllOrders({});

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { AND: [{}, {}] }, // Empty filter objects
          include: expect.any(Object),
        })
      );
      expect(prisma.order.count).toHaveBeenCalledWith(expect.any(Object));
      expect(result.orders).toEqual(mockOrdersList);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter orders by status', async () => {
      const mockOrdersList = [{ ...mockOrder, orderStatus: OrderStatus.SHIPPED }];
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrdersList);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await orderService.getAllOrders({ status: OrderStatus.SHIPPED });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { AND: [{ status: OrderStatus.SHIPPED }, {}] },
        })
      );
      expect(result.orders).toEqual(mockOrdersList);
    });

    it('should filter orders by search term', async () => {
      const mockOrdersList = [{ ...mockOrder, orderNumber: 'ORD-SEARCH' }];
      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrdersList);
      (prisma.order.count as jest.Mock).mockResolvedValue(1);

      const result = await orderService.getAllOrders({ search: 'SEARCH' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {},
              {
                OR: [
                  { orderNumber: { contains: 'SEARCH' } },
                  { shippingPhone: { contains: 'SEARCH' } },
                  { user: { email: { contains: 'SEARCH' } } },
                ],
              },
            ],
          },
        })
      );
      expect(result.orders).toEqual(mockOrdersList);
    });
  });
});
