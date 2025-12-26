import mongoose, { Document, Schema } from 'mongoose';

// Interfaces
export interface IPointTransaction {
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  amount: number;
  orderId?: mongoose.Types.ObjectId;
  description: string;
  expiresAt?: Date;
  expirationProcessed?: boolean;
  createdAt: Date;
}

export interface ILoyaltyAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  currentPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  history: IPointTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Point Transaction Schema
const PointTransactionSchema = new Schema<IPointTransaction>({
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'adjust'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  description: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
  },
  expirationProcessed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Loyalty Account Schema
const LoyaltyAccountSchema = new Schema<ILoyaltyAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    history: [PointTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes (unique field userId already has index)
LoyaltyAccountSchema.index({ tier: 1 });
LoyaltyAccountSchema.index({ currentPoints: -1 });
LoyaltyAccountSchema.index({ 'history.expiresAt': 1 });

const LoyaltyAccount = mongoose.model<ILoyaltyAccount>('LoyaltyAccount', LoyaltyAccountSchema);

export default LoyaltyAccount;
