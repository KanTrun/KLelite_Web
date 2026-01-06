import { Cart, Prisma, CartItem } from '@prisma/client';
import prisma from '../lib/prisma';

export interface AddToCartDTO {
  userId: string;
  productId: string;
  quantity: number;
  size?: string;
  customization?: any;
}

export interface UpdateCartItemDTO {
  quantity: number;
}

export const cartService = {
  /**
   * Get or create cart for user
   */
  async getCart(userId: string): Promise<Cart & { items: (CartItem & { product: any })[] }> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    }

    return cart;
  },

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartDTO) {
    const { userId, productId, quantity, size, customization } = data;

    // 1. Get product price
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true, name: true }
    });

    if (!product) throw new Error('Product not found');

    // 2. Get User Cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // 3. Upsert Cart Item
    // Fetch all items for this product in the cart to check for matching size and customization
    const existingItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        productId,
      }
    });

    // Find exact match for size and customization
    // We do this in code because comparing JSON in SQL varies by DB and Prisma version
    const itemToUpdate = existingItems.find(item => {
      const sizeMatch = item.size === (size || null);

      // Deep compare customization (assuming simple object or null)
      // If one is null/undefined and other is too -> match
      // If both objects -> compare JSON strings (ignoring key order would be better but stringify is a decent proxy for now)
      // For strict correctness with KISS:
      const cust1 = item.customization ? JSON.stringify(item.customization) : null;
      const cust2 = customization ? JSON.stringify(customization) : null;
      const customizationMatch = cust1 === cust2;

      return sizeMatch && customizationMatch;
    });

    if (itemToUpdate) {
      await prisma.cartItem.update({
        where: { id: itemToUpdate.id },
        data: {
          quantity: itemToUpdate.quantity + quantity
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size,
          customization: customization ?? Prisma.JsonNull,
          price: product.price // Snapshot price
        }
      });
    }

    // 4. Recalculate Cart Totals
    return this.recalculateCart(cart.id);
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeCartItem(cartItemId);
    }

    const item = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    return this.recalculateCart(item.cartId);
  },

  /**
   * Remove item from cart
   */
  async removeCartItem(cartItemId: string) {
    const item = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item) return null; // or throw

    await prisma.cartItem.delete({
      where: { id: cartItemId }
    });

    return this.recalculateCart(item.cartId);
  },

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        totalItems: 0,
        totalPrice: 0
      }
    });
  },

  /**
   * Recalculate cart totals helper
   */
  async recalculateCart(cartId: string) {
    const items = await prisma.cartItem.findMany({
      where: { cartId }
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
      return sum + (Number(item.price) * item.quantity);
    }, 0);

    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        totalItems,
        totalPrice
      },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return updatedCart;
  }
};
