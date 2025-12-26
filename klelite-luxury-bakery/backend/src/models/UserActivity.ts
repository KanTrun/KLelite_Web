import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  userId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  activityType: 'view' | 'cart_add' | 'purchase' | 'review';
  metadata?: {
    rating?: number;
    quantity?: number;
    price?: number;
    [key: string]: any;
  };
  createdAt: Date;
}

const UserActivitySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  activityType: {
    type: String,
    enum: ['view', 'cart_add', 'purchase', 'review'],
    required: true
  },
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 } // 90 days TTL
});

// Indexes for performance
UserActivitySchema.index({ userId: 1, productId: 1 });
UserActivitySchema.index({ productId: 1, activityType: 1 });
UserActivitySchema.index({ createdAt: -1 });

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);
