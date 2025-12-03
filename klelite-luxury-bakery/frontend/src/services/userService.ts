import api from './api';
import type { 
  User, 
  Address, 
  WishlistItem,
  ApiResponse 
} from '@/types';

// User Service
export const userService = {
  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/profile');
    return response.data.data;
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/users/profile', data);
    return response.data.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post<ApiResponse<{ url: string }>>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.url;
  },

  // Get addresses
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get<ApiResponse<Address[]>>('/users/addresses');
    return response.data.data;
  },

  // Add address
  addAddress: async (address: Omit<Address, '_id'>): Promise<Address> => {
    const response = await api.post<ApiResponse<Address>>('/users/addresses', address);
    return response.data.data;
  },

  // Update address
  updateAddress: async (id: string, address: Partial<Address>): Promise<Address> => {
    const response = await api.put<ApiResponse<Address>>(`/users/addresses/${id}`, address);
    return response.data.data;
  },

  // Delete address
  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/users/addresses/${id}`);
  },

  // Set default address
  setDefaultAddress: async (id: string): Promise<Address> => {
    const response = await api.put<ApiResponse<Address>>(`/users/addresses/${id}/default`);
    return response.data.data;
  },

  // Get wishlist
  getWishlist: async (): Promise<WishlistItem[]> => {
    const response = await api.get<ApiResponse<WishlistItem[]>>('/users/wishlist');
    return response.data.data;
  },

  // Add to wishlist
  addToWishlist: async (productId: string): Promise<WishlistItem> => {
    const response = await api.post<ApiResponse<WishlistItem>>('/users/wishlist', { productId });
    return response.data.data;
  },

  // Remove from wishlist
  removeFromWishlist: async (productId: string): Promise<void> => {
    await api.delete(`/users/wishlist/${productId}`);
  },

  // Check if product in wishlist
  isInWishlist: async (productId: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<{ inWishlist: boolean }>>(`/users/wishlist/check/${productId}`);
    return response.data.data.inWishlist;
  },
};

// Admin User Service
export const adminUserService = {
  // Get all users
  getUsers: async (page = 1, limit = 10, search?: string): Promise<ApiResponse<User[]>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    
    const response = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  // Create user
  createUser: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role: 'user' | 'manager' | 'admin';
  }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  // Update user
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Update user role
  updateUserRole: async (id: string, role: 'user' | 'admin' | 'manager'): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, { role });
    return response.data.data;
  },

  // Toggle user status (active/inactive)
  toggleUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, { isActive });
    return response.data.data;
  },
};
