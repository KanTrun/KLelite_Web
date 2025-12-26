import Product, { IProduct } from '../models/Product';
import { config } from '../config';
import mongoose from 'mongoose';

export interface SearchOptions {
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult {
  hits: IProduct[];
  total: number;
  query: string;
  took: number;
}

/**
 * Search service supporting both MongoDB Atlas Search and fallback text search
 */
export class SearchService {
  /**
   * Main search method - uses Atlas Search if enabled, fallback to text search
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = options.limit || 10;

    try {
      let results: IProduct[];
      let total: number;

      if (config.search.useAtlasSearch) {
        // Use MongoDB Atlas Search ($search aggregation)
        const pipeline = this.buildAtlasSearchPipeline(query, options);
        results = await Product.aggregate(pipeline);
        total = results.length;
      } else {
        // Fallback to MongoDB text search
        const textQuery = this.buildTextSearchQuery(query, options);
        results = await Product.find(textQuery)
          .populate('category', 'name slug')
          .limit(limit)
          .lean<IProduct[]>();
        total = await Product.countDocuments(textQuery);
      }

      const took = Date.now() - startTime;

      return {
        hits: results.slice(0, limit),
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
      if (config.search.useAtlasSearch) {
        // Atlas Search autocomplete
        const pipeline = this.buildAtlasSearchPipeline(query, { limit });
        const results = await Product.aggregate(pipeline);
        return results.map((p) => p.name).slice(0, limit);
      } else {
        // Text search fallback
        const textQuery = this.buildTextSearchQuery(query, { limit });
        const results = await Product.find(textQuery)
          .select('name')
          .limit(limit)
          .lean();
        return results.map((p) => p.name);
      }
    } catch (error) {
      console.error('Suggest error:', error);
      return [];
    }
  }

  /**
   * Build MongoDB Atlas Search aggregation pipeline
   */
  private buildAtlasSearchPipeline(query: string, options: SearchOptions): any[] {
    const pipeline: any[] = [
      {
        $search: {
          index: config.search.indexName,
          compound: {
            should: [
              {
                // Autocomplete on name field
                autocomplete: {
                  query: query,
                  path: 'name',
                  fuzzy: {
                    maxEdits: 2,
                    prefixLength: 1,
                  },
                },
              },
              {
                // Text search on name, description, tags
                text: {
                  query: query,
                  path: ['name', 'description', 'tags'],
                  fuzzy: {
                    maxEdits: 2,
                  },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          score: { $meta: 'searchScore' },
        },
      },
    ];

    // Add filters
    const filters: any[] = [];

    if (options.category) {
      filters.push({
        equals: {
          path: 'category',
          value: new mongoose.Types.ObjectId(options.category),
        },
      });
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      const rangeFilter: any = { path: 'price' };
      if (options.minPrice !== undefined) rangeFilter.gte = options.minPrice;
      if (options.maxPrice !== undefined) rangeFilter.lte = options.maxPrice;
      filters.push({ range: rangeFilter });
    }

    if (filters.length > 0) {
      pipeline[0].$search.compound.filter = filters;
    }

    // Lookup category
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    });

    // Limit results
    if (options.limit) {
      pipeline.push({ $limit: options.limit });
    }

    return pipeline;
  }

  /**
   * Build MongoDB text search query (fallback)
   */
  private buildTextSearchQuery(query: string, options: SearchOptions): any {
    const searchQuery: any = {
      $text: { $search: query },
      isAvailable: true,
    };

    // Add filters
    if (options.category) {
      searchQuery.category = options.category;
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      searchQuery.price = {};
      if (options.minPrice !== undefined) searchQuery.price.$gte = options.minPrice;
      if (options.maxPrice !== undefined) searchQuery.price.$lte = options.maxPrice;
    }

    return searchQuery;
  }
}

export const searchService = new SearchService();
