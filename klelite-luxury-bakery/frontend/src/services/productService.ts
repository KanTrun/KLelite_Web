import api from './api';
import type { 
  Product, 
  ProductFilter, 
  ProductsResponse, 
  Category,
  ApiResponse 
} from '@/types';

// Extended API response with pagination at root level
interface ProductsApiResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Product Service
export const productService = {
  // Get all products with filters
  getProducts: async (filters?: ProductFilter): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<ProductsApiResponse>(`/products?${params.toString()}`);
    // Map API response to expected format
    return {
      products: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Get single product by ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${slug}`);
    return response.data.data;
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(`/products/featured?limit=${limit}`);
    return response.data.data;
  },

  // Search products
  searchProducts: async (query: string, limit = 10): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(
      `/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data;
  },

  // Get related products
  getRelatedProducts: async (productId: string, limit = 4): Promise<Product[]> => {
    const response = await api.get<ApiResponse<Product[]>>(
      `/products/${productId}/related?limit=${limit}`
    );
    return response.data.data;
  },

  // Get products by category
  getProductsByCategory: async (categoryId: string, filters?: ProductFilter): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    params.append('category', categoryId);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'category') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<ApiResponse<ProductsResponse>>(`/products?${params.toString()}`);
    return response.data.data;
  },

  // Admin: Create product
  createProduct: async (data: FormData | Partial<Product>): Promise<Product> => {
    const isFormData = data instanceof FormData;
    const response = await api.post<ApiResponse<Product>>('/products', data, isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined);
    return response.data.data;
  },

  // Admin: Update product
  updateProduct: async (id: string, data: FormData | Partial<Product>): Promise<Product> => {
    const isFormData = data instanceof FormData;
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data, isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : undefined);
    return response.data.data;
  },

  // Admin: Delete product
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Category Service
export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return response.data.data;
  },

  // Admin: Create category
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  // Admin: Update category
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  // Admin: Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};
