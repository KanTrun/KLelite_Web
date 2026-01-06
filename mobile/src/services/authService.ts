import api from './api';
import { LoginCredentials, RegisterData, AuthResponse } from '@shared/types/user';
import { storage } from '../utils/storage';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.accessToken) {
      await storage.setToken(response.data.accessToken);
      await storage.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      await storage.setToken(response.data.accessToken);
      await storage.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await storage.clearAuth();
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
