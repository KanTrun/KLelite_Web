import api from './api';
import type { Product } from '@/types';

/**
 * Search service for product search and autocomplete
 */

export interface SearchOptions {
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  hits: Product[];
  total: number;
  query: string;
  took: number;
  message?: string;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export const searchService = {
  /**
   * Search products with typo tolerance and fuzzy matching
   */
  search: async (query: string, options?: SearchOptions): Promise<SearchResult> => {
    const params = new URLSearchParams({ q: query });

    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.category) params.append('category', options.category);
    if (options?.minPrice) params.append('minPrice', options.minPrice.toString());
    if (options?.maxPrice) params.append('maxPrice', options.maxPrice.toString());

    const response = await api.get<{ success: boolean; data: SearchResult }>(
      `/search?${params.toString()}`
    );

    return response.data.data;
  },

  /**
   * Get autocomplete suggestions
   */
  suggest: async (query: string): Promise<string[]> => {
    if (query.trim().length < 2) {
      return [];
    }

    const response = await api.get<{ success: boolean; data: SearchSuggestionsResponse }>(
      `/search/suggest?q=${encodeURIComponent(query)}`
    );

    return response.data.data.suggestions;
  },
};
