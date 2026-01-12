import api from './api';
import type { ApiResponse } from '@/types';

// Loyalty Types
export interface PointTransaction {
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  amount: number;
  orderId?: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
}

export interface TierInfo {
  name: string;
  multiplier: number;
  threshold: number;
  benefits: string[];
}

export interface LoyaltyAccount {
  id: string;
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  history: PointTransaction[];
  tierInfo: TierInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateRedemptionRequest {
  points: number;
}

export interface ValidateRedemptionResponse {
  valid: boolean;
  discount: number;
  remainingPoints: number;
}

// Loyalty Service
export const loyaltyService = {
  // Get my loyalty account
  getMyLoyalty: async (): Promise<LoyaltyAccount> => {
    const response = await api.get<ApiResponse<LoyaltyAccount>>('/loyalty');
    return response.data.data;
  },

  // Get points history
  getPointsHistory: async (): Promise<PointTransaction[]> => {
    const response = await api.get<ApiResponse<{ history: PointTransaction[] }>>('/loyalty/history');
    return response.data.data.history;
  },

  // Validate points redemption
  validateRedemption: async (points: number): Promise<ValidateRedemptionResponse> => {
    const response = await api.post<ApiResponse<ValidateRedemptionResponse>>(
      '/loyalty/validate-redemption',
      { points }
    );
    return response.data.data;
  },

  // Get all tiers info
  getTiersInfo: async (): Promise<TierInfo[]> => {
    const response = await api.get<ApiResponse<{ tiers: TierInfo[] }>>('/loyalty/tiers');
    return response.data.data.tiers;
  },
};

export default loyaltyService;
