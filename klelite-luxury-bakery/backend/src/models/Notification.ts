import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'order_status' | 'points_earned' | 'flash_sale' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: {
    orderId?: Types.ObjectId;
    productId?: Types.ObjectId;
    url?: string;
    [key: string]: any;
  };
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['order_status', 'points_earned', 'flash_sale', 'promotion', 'system'],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries: userId + read status + sort by created date
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Index for cleanup queries (delete old read notifications)
NotificationSchema.index({ read: 1, createdAt: 1 });

const Notification = model<INotification>('Notification', NotificationSchema);

export default Notification;
