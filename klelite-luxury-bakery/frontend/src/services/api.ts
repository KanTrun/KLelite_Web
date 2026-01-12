import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config/config';

// Create axios instance
const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  withCredentials: true, // Enable sending cookies with cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${config.apiUrl}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Update cookie for SSE authentication
          document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Clear cookie
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';

        // List of public endpoints that can be retried without auth
        const publicEndpoints = [
          '/products',
          '/categories',
        ];

        // If the failed request was to a public endpoint, retry without token (downgrade to guest)
        const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));

        if (isPublicEndpoint && originalRequest.headers) {
             delete originalRequest.headers.Authorization;
             return api(originalRequest);
        }

        // Only redirect to login if NOT a public endpoint
        window.location.replace('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Error type enumeration
export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

// Structured error information
export interface ApiError {
  message: string;
  type: ErrorType;
  code?: string;
}

// Helper function to get structured error information
export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    // Network Error (e.g. server down, CORS, connection refused)
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return {
        message: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.',
        type: ErrorType.NETWORK,
        code: error.code,
      };
    }

    // Server Error (5xx)
    if (error.response && error.response.status >= 500) {
      return {
        message: 'Lỗi máy chủ. Vui lòng thử lại sau.',
        type: ErrorType.SERVER,
        code: `HTTP_${error.response.status}`,
      };
    }

    // Client Error (4xx)
    if (error.response && error.response.status >= 400) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        message: axiosError.response?.data?.message || axiosError.message || 'Đã có lỗi xảy ra',
        type: ErrorType.CLIENT,
        code: `HTTP_${error.response.status}`,
      };
    }

    const axiosError = error as AxiosError<{ message?: string }>;
    return {
      message: axiosError.response?.data?.message || axiosError.message || 'Đã có lỗi xảy ra',
      type: ErrorType.UNKNOWN,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message,
      type: ErrorType.UNKNOWN,
    };
  }
  return {
    message: 'Đã có lỗi xảy ra',
    type: ErrorType.UNKNOWN,
  };
};

// Legacy helper for backward compatibility
export const getErrorMessage = (error: unknown): string => {
  return getApiError(error).message;
};
