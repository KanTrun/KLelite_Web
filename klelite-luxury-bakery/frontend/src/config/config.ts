// Application Configuration
export const config = {
  // API
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  
  // App Info
  appName: import.meta.env.VITE_APP_NAME || "KL'élite Luxury Bakery",
  
  // Stripe
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
  
  // Pagination
  defaultPageSize: 12,
  pageSizeOptions: [12, 24, 36, 48],
  
  // Image
  defaultProductImage: '/images/placeholder-product.png',
  defaultAvatarImage: '/images/placeholder-avatar.png',
  
  // Currency
  currency: 'VND',
  currencySymbol: '₫',
  locale: 'vi-VN',
  
  // Order Status
  orderStatuses: {
    pending: { label: 'Chờ xác nhận', color: '#ffc107' },
    confirmed: { label: 'Đã xác nhận', color: '#17a2b8' },
    processing: { label: 'Đang xử lý', color: '#6f42c1' },
    shipping: { label: 'Đang giao hàng', color: '#007bff' },
    delivered: { label: 'Đã giao hàng', color: '#28a745' },
    cancelled: { label: 'Đã hủy', color: '#dc3545' },
    returned: { label: 'Đã hoàn trả', color: '#6c757d' },
  },
  
  // Payment Methods
  paymentMethods: {
    cod: { label: 'Thanh toán khi nhận hàng', icon: 'cash' },
    bank_transfer: { label: 'Chuyển khoản ngân hàng', icon: 'bank' },
    credit_card: { label: 'Thẻ tín dụng/Ghi nợ', icon: 'card' },
    momo: { label: 'Ví MoMo', icon: 'momo' },
    vnpay: { label: 'VNPay', icon: 'vnpay' },
  },
  
  // Social Links
  socialLinks: {
    facebook: 'https://facebook.com/klelite',
    instagram: 'https://instagram.com/klelite',
    tiktok: 'https://tiktok.com/@klelite',
  },
  
  // Contact Info
  contact: {
    phone: '0123 456 789',
    email: 'contact@klelite.com',
    address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
  },
} as const;

export type Config = typeof config;
