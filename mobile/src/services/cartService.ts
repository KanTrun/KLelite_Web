import api from './api';
import { Cart } from '@shared/types/cart';

export const cartService = {
  getCart: async () => {
    const response = await api.get<Cart>('/cart');
    return response.data;
  },
  addToCart: async (productId: string, quantity: number) => {
    const response = await api.post<Cart>('/cart/items', { productId, quantity });
    return response.data;
  },
  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await api.put<Cart>(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },
  removeFromCart: async (itemId: string) => {
    const response = await api.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },
  clearCart: async () => {
    await api.delete('/cart');
  }
};
