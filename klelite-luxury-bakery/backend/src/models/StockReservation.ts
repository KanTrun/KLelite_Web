import mongoose, { Document, Schema } from 'mongoose';

export interface IStockReservation extends Document {
  flashSaleId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  quantity: number;
  expiresAt: Date;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const StockReservationSchema = new Schema<IStockReservation>(
  {
    flashSaleId: {
      type: Schema.Types.ObjectId,
      ref: 'FlashSale',
      required: [true, 'Flash sale ID is required'],
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
StockReservationSchema.index({ flashSaleId: 1, productId: 1, userId: 1 });
StockReservationSchema.index({ status: 1, expiresAt: 1 });

// TTL index - automatically delete expired reservations after 24 hours
StockReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const StockReservation = mongoose.model<IStockReservation>(
  'StockReservation',
  StockReservationSchema
);

export default StockReservation;
