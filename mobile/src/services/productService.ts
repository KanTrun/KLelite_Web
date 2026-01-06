import api from './api';
import { Product, ProductsResponse, ProductFilter, Category } from '@shared/types/product';

export const productService = {
  getProducts: async (filters?: ProductFilter) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }
    const response = await api.get<ProductsResponse>(`/products?${params.toString()}`);
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await api.get<{ product: Product; relatedProducts: Product[] }>(`/products/${slug}`);
    return response.data;
  },

  getFeaturedProducts: async () => {
    const response = await api.get<Product[]>('/products/featured');
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  }
};
