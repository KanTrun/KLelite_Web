import axios from 'axios';
import { API_URL } from '../config/env';
import { storage } from '../utils/storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      // TODO: Implement token refresh logic
      // For now, clear auth to force login
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);

export default api;
