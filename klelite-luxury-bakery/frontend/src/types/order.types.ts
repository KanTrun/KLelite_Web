import type { Product } from './product.types';
import type { Address, User } from './user.types';

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  user: User | string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number; // Backend dùng 'total' không phải 'totalAmount'
  totalAmount?: number; // Alias for compatibility
  shippingAddress: Address;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: string;
  };
  paymentMethod?: PaymentMethod; // Legacy support
  paymentStatus?: PaymentStatus; // Legacy support
  status: OrderStatus; // Backend dùng 'status' không phải 'orderStatus'
  orderStatus?: OrderStatus; // Legacy support
  note?: string;
  notes?: string; // Alias
  trackingNumber?: string;
  voucherCode?: string;
  voucher?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  isGift?: boolean;
  giftMessage?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id?: string;
  product: Product | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  customization?: string;
  total?: number;
}

export type PaymentMethod = 'cod' | 'bank_transfer' | 'credit_card' | 'momo' | 'vnpay';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface CreateOrderData {
  items: {
    product: string;
    quantity: number;
  }[];
  shippingAddress: Omit<Address, 'id'>;
  paymentMethod: PaymentMethod;
  notes?: string;
  voucher?: string;
}

export interface OrderFilter {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
