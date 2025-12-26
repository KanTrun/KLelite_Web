import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Product, Category, ProductFilter, ProductsResponse } from '@/types';
import { productService, categoryService } from '@/services';
import { getApiError, ErrorType } from '@/services/api';

interface ProductState {
  products: Product[];
  featuredProducts: Product[];
  categories: Category[];
  currentProduct: Product | null;
  relatedProducts: Product[];
  searchResults: Product[];
  filters: ProductFilter;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  errorType: ErrorType | null;
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  categories: [],
  currentProduct: null,
  relatedProducts: [],
  searchResults: [],
  filters: {
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
  errorType: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk<ProductsResponse, ProductFilter | undefined>(
  'product/fetchProducts',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk<Product[], number | undefined>(
  'product/fetchFeaturedProducts',
  async (limit, { rejectWithValue }) => {
    try {
      const products = await productService.getFeaturedProducts(limit);
      return products;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

export const fetchProductBySlug = createAsyncThunk<Product, string>(
  'product/fetchProductBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const product = await productService.getProductBySlug(slug);
      return product;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk<Product[], string>(
  'product/fetchRelatedProducts',
  async (productId, { rejectWithValue }) => {
    try {
      const products = await productService.getRelatedProducts(productId);
      return products;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

export const searchProducts = createAsyncThunk<Product[], string>(
  'product/searchProducts',
  async (query, { rejectWithValue }) => {
    try {
      const products = await productService.searchProducts(query);
      return products;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

export const fetchCategories = createAsyncThunk<Category[]>(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await categoryService.getCategories();
      return categories;
    } catch (error) {
      const apiError = getApiError(error);
      return rejectWithValue(apiError);
    }
  }
);

// Slice
const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
      state.errorType = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.errorType = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        const apiError = action.payload as { message: string; type: ErrorType };
        state.error = apiError.message;
        state.errorType = apiError.type;
      });

    // Fetch featured products
    builder
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      });

    // Fetch product by slug
    builder
      .addCase(fetchProductBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.errorType = null;
      })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.isLoading = false;
        const apiError = action.payload as { message: string; type: ErrorType };
        state.error = apiError.message;
        state.errorType = apiError.type;
      });

    // Fetch related products
    builder
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedProducts = action.payload;
      });

    // Search products
    builder
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state) => {
        state.isLoading = false;
        state.searchResults = [];
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  clearCurrentProduct,
  clearSearchResults,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;
