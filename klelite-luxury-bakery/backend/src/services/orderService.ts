import { Order, Prisma, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
  size?: string;
  customization?: any;
  price: number;
  name: string;
  image?: string;
}

export interface CreateOrderDTO {
  userId: string;
  items: CreateOrderItemDTO[];
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingWard: string;
  shippingDistrict: string;
  shippingCity: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
  note?: string;
  deliveryDate?: Date;
  deliveryTimeSlot?: string;
  isGift?: boolean;
  giftMessage?: string;
}

export interface OrderFilterDTO {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  userId?: string;
  search?: string; // Order ID or User info
}

export const orderService = {
  /**
   * Create a new order with transaction
   */
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    const { items, ...orderData } = data;

    // Generate unique order number (e.g., ORD-timestamp-random)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return prisma.$transaction(async (tx) => {
      // 0. Verify Stock Availability first
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true, isAvailable: true }
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (!product.isAvailable) {
          throw new Error(`Product '${product.name}' is currently unavailable`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
      }

      // 1. Create Order
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderNumber,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              name: item.name,
              image: item.image,
              quantity: item.quantity,
              size: item.size,
              customization: item.customization,
              price: item.price,
              total: item.price * item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });

      // 2. Update Product Stock and Sold count
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity }
          }
        });
      }

      // 3. Clear User Cart (Optional - usually handled by controller or here if cartId provided)
      // If we want to clear cart here, we need cart logic.
      // Let's assume controller handles cart clearing or we add it later.

      return order;
    });
  },

  /**
   * Get user orders
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return {
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true // useful for linking back
              }
            }
          }
        },
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order> {
    const data: Prisma.OrderUpdateInput = { status };
    if (paymentStatus) {
      data.paymentStatus = paymentStatus;
      if (paymentStatus === 'PAID') {
        data.paidAt = new Date();
      }
    }

    if (status === 'DELIVERED') {
      data.deliveredAt = new Date();
    } else if (status === 'CANCELLED') {
      data.cancelledAt = new Date();
      // TODO: Restore stock if cancelled?
    }

    return prisma.order.update({
      where: { id },
      data,
      include: { items: true }
    });
  },

  /**
   * Admin: Get all orders
   */
  async getAllOrders(filters: OrderFilterDTO) {
      const { page = 1, limit = 10, status, search } = filters;
      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {
          AND: [
              status ? { status } : {},
              search ? {
                  OR: [
                      { orderNumber: { contains: search } },
                      { shippingPhone: { contains: search } },
                      { user: { email: { contains: search } } }
                  ]
              } : {}
          ]
      };

      const [orders, total] = await Promise.all([
          prisma.order.findMany({
              where,
              skip,
              take: limit,
              orderBy: { createdAt: 'desc' },
              include: {
                  user: {
                      select: {
                          firstName: true,
                          lastName: true,
                          email: true
                      }
                  },
                  _count: {
                      select: { items: true }
                  }
              }
          }),
          prisma.order.count({ where })
      ]);

      return {
          orders,
          total,
          page,
          pages: Math.ceil(total / limit)
      };
  }
};
