import api from './api';
import type { ApiResponse } from '@/types';

export interface PaymentResponse {
  payUrl: string;
  orderId: string;
  message: string;
}

export interface PaymentStatus {
  orderId: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  transactionId?: string;
  paidAt?: string;
}

export const paymentService = {
  // Create MoMo payment
  createMoMoPayment: async (orderId: string, amount: number, orderInfo?: string): Promise<PaymentResponse> => {
    const response = await api.post<ApiResponse<PaymentResponse>>('/payments/momo/create', {
      orderId,
      amount,
      orderInfo,
    });
    return response.data.data;
  },

  // Create VNPay payment
  createVNPayPayment: async (
    orderId: string, 
    amount: number, 
    orderInfo?: string,
    bankCode?: string
  ): Promise<PaymentResponse> => {
    const response = await api.post<ApiResponse<PaymentResponse>>('/payments/vnpay/create', {
      orderId,
      amount,
      orderInfo,
      bankCode,
    });
    return response.data.data;
  },

  // Get payment status
  getPaymentStatus: async (orderId: string): Promise<PaymentStatus> => {
    const response = await api.get<ApiResponse<PaymentStatus>>(`/payments/status/${orderId}`);
    return response.data.data;
  },
};

export default paymentService;
