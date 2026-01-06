// Product Types
export interface ProductImage {
  url: string;
  publicId: string;
  isMain: boolean;
  _id?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  originalPrice?: number;
  discount?: number;
  images: ProductImage[];
  mainImage?: string;
  category: Category | string;
  stock: number;
  sold?: number;
  sku: string;
  tags: string[];
  isFeatured?: boolean;
  featured?: boolean;
  isAvailable?: boolean;
  isNewProduct?: boolean;
  rating: number;
  numReviews?: number;
  reviewCount?: number;
  isActive?: boolean;
  ingredients?: string[];
  allergens?: string[];
  sizes?: ProductSize[];
  nutritionFacts?: NutritionFacts;
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSize {
  name: string;
  price: number;
  _id?: string;
}

export interface ProductReview {
  _id: string;
  user: string | { firstName: string; lastName: string; avatar?: string };
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionFacts {
  calories?: number;
  fat?: number;
  carbs?: number;
  protein?: number;
  sugar?: number;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  search?: string;
  sortBy?: 'price' | 'rating' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
