import api from './api';
import type { ApiResponse } from '@/types';

export interface Voucher {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  userLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface VoucherValidation {
  valid?: boolean;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount: number;
  message: string;
  voucher?: Voucher;
}

export interface AppliedVoucher {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  value: number;
}

export const voucherService = {
  // Validate voucher code
  validateVoucher: async (code: string, orderTotal: number): Promise<VoucherValidation> => {
    const response = await api.post<ApiResponse<VoucherValidation>>('/vouchers/validate', {
      code,
      orderTotal,
    });
    return response.data.data;
  },

  // Get available vouchers for current user
  getAvailableVouchers: async (): Promise<Voucher[]> => {
    const response = await api.get<ApiResponse<Voucher[]>>('/vouchers/available');
    return response.data.data;
  },

  // Admin: Get all vouchers
  getVouchers: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: 'percentage' | 'fixed';
  }): Promise<ApiResponse<Voucher[]>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.isActive !== undefined) searchParams.append('isActive', String(params.isActive));
    if (params?.type) searchParams.append('type', params.type);

    const response = await api.get<ApiResponse<Voucher[]>>(`/vouchers?${searchParams.toString()}`);
    return response.data;
  },

  // Admin: Get voucher by ID
  getVoucherById: async (id: string): Promise<Voucher> => {
    const response = await api.get<ApiResponse<Voucher>>(`/vouchers/${id}`);
    return response.data.data;
  },

  // Admin: Create voucher
  createVoucher: async (data: Omit<Voucher, '_id' | 'usedCount'>): Promise<Voucher> => {
    const response = await api.post<ApiResponse<Voucher>>('/vouchers', data);
    return response.data.data;
  },

  // Admin: Update voucher
  updateVoucher: async (id: string, data: Partial<Voucher>): Promise<Voucher> => {
    const response = await api.put<ApiResponse<Voucher>>(`/vouchers/${id}`, data);
    return response.data.data;
  },

  // Admin: Delete voucher
  deleteVoucher: async (id: string): Promise<void> => {
    await api.delete(`/vouchers/${id}`);
  },
};

export default voucherService;
