import api from './api';
import type { Cart, CartItem, ApiResponse } from '@/types';

// Cart Service
export const cartService = {
  // Get cart
  getCart: async (): Promise<Cart> => {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data.data;
  },

  // Add item to cart
  addToCart: async (productId: string, quantity = 1): Promise<Cart> => {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<Cart> => {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data.data;
  },

  // Clear cart
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },

  // Apply voucher
  applyVoucher: async (code: string): Promise<Cart> => {
    const response = await api.post<ApiResponse<Cart>>('/cart/voucher', { code });
    return response.data.data;
  },

  // Remove voucher
  removeVoucher: async (): Promise<Cart> => {
    const response = await api.delete<ApiResponse<Cart>>('/cart/voucher');
    return response.data.data;
  },
};

// Local Cart Service (for guests)
const LOCAL_CART_KEY = 'klelite_cart';

export interface LocalCartItem {
  productId: string;
  quantity: number;
}

export const localCartService = {
  // Get local cart
  getCart: (): LocalCartItem[] => {
    const cart = localStorage.getItem(LOCAL_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  },

  // Save local cart
  saveCart: (items: LocalCartItem[]): void => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  },

  // Add item to local cart
  addItem: (productId: string, quantity = 1): LocalCartItem[] => {
    const cart = localCartService.getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    
    localCartService.saveCart(cart);
    return cart;
  },

  // Update item quantity
  updateItem: (productId: string, quantity: number): LocalCartItem[] => {
    const cart = localCartService.getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
      if (quantity <= 0) {
        return localCartService.removeItem(productId);
      }
      item.quantity = quantity;
      localCartService.saveCart(cart);
    }
    
    return cart;
  },

  // Remove item
  removeItem: (productId: string): LocalCartItem[] => {
    const cart = localCartService.getCart().filter(item => item.productId !== productId);
    localCartService.saveCart(cart);
    return cart;
  },

  // Clear local cart
  clearCart: (): void => {
    localStorage.removeItem(LOCAL_CART_KEY);
  },

  // Merge local cart to server cart (after login)
  mergeToServerCart: async (): Promise<Cart | null> => {
    const localCart = localCartService.getCart();
    
    if (localCart.length === 0) {
      return null;
    }

    try {
      // Add each local item to server cart
      let cart: Cart | null = null;
      for (const item of localCart) {
        cart = await cartService.addToCart(item.productId, item.quantity);
      }
      
      // Clear local cart after merge
      localCartService.clearCart();
      
      return cart;
    } catch (error) {
      console.error('Failed to merge cart:', error);
      return null;
    }
  },
};

export type { Cart, CartItem };
