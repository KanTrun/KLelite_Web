import mongoose, { Document, Schema, Model, HydratedDocument } from 'mongoose';
import slugify from 'slugify';

// Interfaces
export interface IProductImage {
  _id?: mongoose.Types.ObjectId;
  url: string;
  publicId?: string;
  isMain: boolean;
}

export interface IProductSize {
  name: string;
  price: number;
  comparePrice?: number;
}

export interface INutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface IReview {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  images: IProductImage[];
  category: mongoose.Types.ObjectId;
  sizes: IProductSize[];
  ingredients?: string[];
  allergens?: string[];
  nutrition?: INutrition;
  tags: string[];
  sku: string;
  stock: number;
  sold: number;
  rating: number;
  numReviews: number;
  reviews: IReview[];
  isFeatured: boolean;
  isAvailable: boolean;
  isNewProduct: boolean;
  preparationTime?: string;
  shelfLife?: string;
  storageInstructions?: string;
  customizable: boolean;
  customizationOptions?: string[];
  relatedProducts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  mainImage: string;
  discountPercentage: number;
}

// Review Schema
const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Vui lòng đánh giá sản phẩm'],
      min: [1, 'Đánh giá tối thiểu là 1'],
      max: [5, 'Đánh giá tối đa là 5'],
    },
    comment: {
      type: String,
      required: [true, 'Vui lòng nhập nhận xét'],
      maxlength: [1000, 'Nhận xét không được quá 1000 ký tự'],
    },
    images: [{
      type: String,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Product Size Schema
const ProductSizeSchema = new Schema<IProductSize>({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  comparePrice: {
    type: Number,
    min: 0,
  },
});

// Nutrition Schema
const NutritionSchema = new Schema<INutrition>({
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
});

// Product Image Schema
const ProductImageSchema = new Schema<IProductImage>({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
  isMain: {
    type: Boolean,
    default: false,
  },
});

// Product Schema
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên sản phẩm'],
      trim: true,
      maxlength: [200, 'Tên sản phẩm không được quá 200 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả sản phẩm'],
      maxlength: [5000, 'Mô tả không được quá 5000 ký tự'],
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Mô tả ngắn không được quá 500 ký tự'],
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá sản phẩm'],
      min: [0, 'Giá không được âm'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Giá so sánh không được âm'],
    },
    images: [ProductImageSchema],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Vui lòng chọn danh mục sản phẩm'],
    },
    sizes: [ProductSizeSchema],
    ingredients: [{
      type: String,
      trim: true,
    }],
    allergens: [{
      type: String,
      trim: true,
    }],
    nutrition: NutritionSchema,
    tags: [{
      type: String,
      trim: true,
    }],
    sku: {
      type: String,
      required: [true, 'Vui lòng nhập mã SKU'],
      unique: true,
      uppercase: true,
    },
    stock: {
      type: Number,
      required: [true, 'Vui lòng nhập số lượng tồn kho'],
      min: [0, 'Số lượng không được âm'],
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: [ReviewSchema],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isNewProduct: {
      type: Boolean,
      default: true,
    },
    preparationTime: String,
    shelfLife: String,
    storageInstructions: String,
    customizable: {
      type: Boolean,
      default: false,
    },
    customizationOptions: [{
      type: String,
    }],
    relatedProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
ProductSchema.virtual('mainImage').get(function (this: IProduct) {
  const main = this.images.find((img: IProductImage) => img.isMain);
  return main ? main.url : this.images[0]?.url || '';
});

ProductSchema.virtual('discountPercentage').get(function (this: IProduct) {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

// Indexes (unique fields already have indexes via unique: true)
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ sold: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isFeatured: 1, isAvailable: 1 });
ProductSchema.index({ tags: 1 });

// Generate slug before saving
ProductSchema.pre('save', function (next: () => void) {
  const doc = this as HydratedDocument<IProduct>;
  if (doc.isModified('name')) {
    doc.slug = slugify(doc.name, { lower: true, strict: true, locale: 'vi' });
  }
  next();
});

// Update rating when reviews change
ProductSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
  } else {
    const total = this.reviews.reduce((sum: number, review: IReview) => sum + review.rating, 0);
    this.rating = Math.round((total / this.reviews.length) * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
