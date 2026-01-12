import api from './api';
import type { ApiResponse } from '@/types';

export interface Review {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  } | string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AddReviewData {
  rating: number;
  comment: string;
}

interface ApiResponseWithPagination<T> extends ApiResponse<T> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reviewService = {
  // Get product reviews
  getProductReviews: async (productId: string, page: number = 1, limit: number = 10): Promise<ReviewsResponse> => {
    const response = await api.get<ApiResponseWithPagination<Review[]>>(`/products/${productId}/reviews`, {
      params: { page, limit }
    });
    return {
      reviews: response.data.data,
      pagination: response.data.pagination || {
        total: response.data.data.length,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    };
  },

  // Add product review
  addReview: async (productId: string, data: AddReviewData): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>(`/products/${productId}/reviews`, data);
    return response.data.data;
  },
};

export default reviewService;
