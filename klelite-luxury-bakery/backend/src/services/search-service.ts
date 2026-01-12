import prisma from '../lib/prisma';
import { Product } from '@prisma/client';
import { config } from '../config';

export interface SearchOptions {
  limit?: number;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  hits: Product[];
  total: number;
  query: string;
  took: number;
}

/**
 * Search service using MySQL full-text search with Prisma
 */
export class SearchService {
  /**
   * Main search method - uses MySQL full-text search
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = options.limit || 10;

    try {
      // Build WHERE clause for filters
      const where: any = {
        isAvailable: true,
      };

      // Add category filter
      if (options.categoryId) {
        where.categoryId = options.categoryId;
      }

      // Add price range filter
      if (options.minPrice !== undefined || options.maxPrice !== undefined) {
        where.price = {};
        if (options.minPrice !== undefined) where.price.gte = options.minPrice;
        if (options.maxPrice !== undefined) where.price.lte = options.maxPrice;
      }

      // Add text search filter - using OR conditions for name and description
      if (query) {
        where.OR = [
          { name: { contains: query } },
          { description: { contains: query } }
        ];
      }

      // Execute search with pagination
      const [results, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.product.count({ where }),
      ]);

      const took = Date.now() - startTime;

      return {
        hits: results,
        total,
        query,
        took,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get auto-suggestions based on query
   */
  async suggest(query: string, limit: number = 5): Promise<string[]> {
    try {
      const results = await prisma.product.findMany({
        where: {
          isAvailable: true,
          OR: [
            { name: { contains: query } }
          ],
        },
        select: {
          name: true,
        },
        take: limit,
        orderBy: {
          name: 'asc',
        },
      });

      return results.map((p) => p.name);
    } catch (error) {
      console.error('Suggest error:', error);
      return [];
    }
  }

  /**
   * Search products by category
   */
  async searchByCategory(categoryId: number, options: SearchOptions = {}): Promise<SearchResult> {
    return this.search('', { ...options, categoryId });
  }

  /**
   * Search products by price range
   */
  async searchByPriceRange(
    minPrice: number,
    maxPrice: number,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    return this.search('', { ...options, minPrice, maxPrice });
  }

  /**
   * Get trending/popular products (most ordered)
   * Note: This requires OrderItem table to track product orders
   */
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    try {
      // For now, just return recent products
      // TODO: Implement proper trending logic based on order statistics
      const products = await prisma.product.findMany({
        where: {
          isAvailable: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      return products;
    } catch (error) {
      console.error('Get trending products error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
