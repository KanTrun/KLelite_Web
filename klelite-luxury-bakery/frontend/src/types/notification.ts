export interface INotification {
  id: string;
  userId: string;
  type: 'order_status' | 'points_earned' | 'flash_sale' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: {
    orderId?: string;
    productId?: string;
    url?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationState {
  items: INotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}
