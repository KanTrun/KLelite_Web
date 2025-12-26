import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IFlashSaleProduct {
  productId: mongoose.Types.ObjectId;
  flashPrice: number;
  originalPrice: number;
  stockLimit: number;
  perUserLimit: number;
  soldCount: number;
}

export interface IFlashSale extends Document {
  name: string;
  slug: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  products: IFlashSaleProduct[];
  earlyAccessTiers: string[];
  earlyAccessMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleProductSchema = new Schema<IFlashSaleProduct>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    flashPrice: {
      type: Number,
      required: [true, 'Flash price is required'],
      min: [0, 'Flash price must be positive'],
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Original price must be positive'],
    },
    stockLimit: {
      type: Number,
      required: [true, 'Stock limit is required'],
      min: [1, 'Stock limit must be at least 1'],
    },
    perUserLimit: {
      type: Number,
      default: 2,
      min: [1, 'Per user limit must be at least 1'],
    },
    soldCount: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative'],
    },
  },
  { _id: false }
);

const FlashSaleSchema = new Schema<IFlashSale>(
  {
    name: {
      type: String,
      required: [true, 'Flash sale name is required'],
      trim: true,
      maxlength: [200, 'Flash sale name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (this: IFlashSale, value: Date) {
          return value > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    products: {
      type: [FlashSaleProductSchema],
      validate: {
        validator: function (value: IFlashSaleProduct[]) {
          return value && value.length > 0;
        },
        message: 'At least one product is required',
      },
    },
    earlyAccessTiers: {
      type: [String],
      default: [],
      enum: {
        values: ['bronze', 'silver', 'gold', 'platinum'],
        message: 'Invalid tier: {VALUE}',
      },
    },
    earlyAccessMinutes: {
      type: Number,
      default: 30,
      min: [0, 'Early access minutes cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Create slug from name before saving
FlashSaleSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Index for efficient querying
FlashSaleSchema.index({ status: 1, startTime: 1, endTime: 1 });

const FlashSale = mongoose.model<IFlashSale>('FlashSale', FlashSaleSchema);

export default FlashSale;
