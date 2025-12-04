import api from './api';
import type { 
  Order, 
  CreateOrderData, 
  OrderFilter, 
  OrdersResponse,
  OrderStatus,
  ApiResponse 
} from '@/types';

interface ApiResponseWithPagination<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Order Service
export const orderService = {
  // Get user orders
  getOrders: async (filters?: OrderFilter): Promise<OrdersResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<ApiResponseWithPagination<Order[]>>(`/orders?${params.toString()}`);
    return {
      orders: response.data.data,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: response.data.data.length,
        totalPages: 1
      }
    };
  },

  // Get single order
  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  // Get order by order number
  getOrderByNumber: async (orderNumber: string): Promise<Order> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/number/${orderNumber}`);
    return response.data.data;
  },

  // Create order
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  // Admin: Get all orders
  getAllOrders: async (filters?: OrderFilter): Promise<OrdersResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<ApiResponseWithPagination<Order[]>>(`/orders/admin/all?${params.toString()}`);
    return {
      orders: response.data.data,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: response.data.data.length,
        totalPages: 1
      }
    };
  },

  // Admin: Update order status
  updateOrderStatus: async (id: string, status: OrderStatus, trackingNumber?: string): Promise<Order> => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}/status`, {
      status,
      trackingNumber,
    });
    return response.data.data;
  },

  // Track order (for guests)
  trackOrder: async (orderNumber: string, phone: string): Promise<Order> => {
    const response = await api.post<ApiResponse<Order>>('/orders/track', {
      orderNumber,
      phone,
    });
    return response.data.data;
  },

  // Admin: Get order statistics
  getOrderStats: async (): Promise<OrderStats> => {
    const response = await api.get<ApiResponse<OrderStats>>('/orders/admin/stats');
    return response.data.data;
  },

  // Admin: Get recent orders (optimized endpoint)
  getRecentOrders: async (limit: number = 5): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(`/orders/admin/recent?limit=${limit}`);
    return response.data.data;
  },

  // Get my orders (user)
  getMyOrders: async (filters?: OrderFilter): Promise<OrdersResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<ApiResponseWithPagination<Order[]>>(`/orders?${params.toString()}`);
    return {
      orders: response.data.data,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        total: response.data.data.length,
        totalPages: 1
      }
    };
  },
};

// Order Stats interface
export interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  ordersByStatus: Record<string, number>;
}
