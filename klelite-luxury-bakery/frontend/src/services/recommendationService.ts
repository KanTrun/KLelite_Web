import api from './api';
import { Product } from '../types/product.types';

interface RecommendationResponse {
  success: boolean;
  data: Product[];
}

export const recommendationService = {
  getSimilarProducts: async (productId: string, limit = 6): Promise<Product[]> => {
    try {
      const response = await api.get<RecommendationResponse>(`/recommendations/similar/${productId}`, {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  },

  getForYou: async (limit = 8): Promise<Product[]> => {
    try {
      const response = await api.get<RecommendationResponse>('/recommendations/for-you', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      return [];
    }
  },

  getTrending: async (limit = 8): Promise<Product[]> => {
    try {
      const response = await api.get<RecommendationResponse>('/recommendations/trending', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  }
};
