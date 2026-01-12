import api from './api';

export interface FlashSaleProduct {
  productId: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    description?: string;
    category?: string;
  };
  flashPrice: number;
  originalPrice: number;
  stockLimit: number;
  perUserLimit: number;
  soldCount: number;
  currentStock?: number;
}

export interface FlashSale {
  id: string;
  name: string;
  slug: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  products: FlashSaleProduct[];
  earlyAccessTiers: string[];
  earlyAccessMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockReservation {
  id: string;
  flashSaleId: string;
  productId: string;
  userId: string;
  quantity: number;
  expiresAt: string;
  status: 'pending' | 'completed' | 'expired';
}

export const flashSaleService = {
  /**
   * Get all active and upcoming flash sales
   */
  getActive: async () => {
    const response = await api.get<{ success: boolean; data: FlashSale[] }>('/flash-sales');
    return response.data;
  },

  /**
   * Get flash sale by slug
   */
  getBySlug: async (slug: string) => {
    const response = await api.get<{ success: boolean; data: FlashSale }>(`/flash-sales/${slug}`);
    return response.data;
  },

  /**
   * Get server time for synchronization
   */
  getServerTime: async () => {
    const response = await api.get<{ success: boolean; data: { serverTime: number } }>('/flash-sales/time');
    return response.data;
  },

  /**
   * Get current stock for a product in flash sale
   */
  getStock: async (saleId: string, productId: string) => {
    const response = await api.get<{ success: boolean; data: { stock: number } }>(
      `/flash-sales/${saleId}/products/${productId}/stock`
    );
    return response.data;
  },

  /**
   * Reserve stock for purchase
   */
  reserve: async (saleId: string, productId: string, quantity: number) => {
    const response = await api.post<{ success: boolean; data: StockReservation; message: string }>(
      `/flash-sales/${saleId}/reserve`,
      { productId, quantity }
    );
    return response.data;
  },
};
