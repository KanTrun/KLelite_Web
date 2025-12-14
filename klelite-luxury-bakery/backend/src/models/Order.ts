import mongoose, { Document, Schema } from 'mongoose';
import { getNextSequence } from '../utils';

// Interfaces
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  quantity: number;
  size?: string;
  customization?: string;
  price: number;
  total: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  ward?: string;
  district: string;
  city: string;
}

export interface IPaymentInfo {
  method: 'cod' | 'bank_transfer' | 'momo' | 'vnpay' | 'stripe';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  payment: IPaymentInfo;
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
  note?: string;
  deliveryDate?: Date;
  deliveryTimeSlot?: string;
  isGift: boolean;
  giftMessage?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Order Item Schema
const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  size: String,
  customization: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Shipping Address Schema
const ShippingAddressSchema = new Schema<IShippingAddress>({
  fullName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  ward: String,
  district: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
});

// Payment Info Schema
const PaymentInfoSchema = new Schema<IPaymentInfo>({
  method: {
    type: String,
    enum: ['cod', 'bank_transfer', 'momo', 'vnpay', 'stripe'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  transactionId: String,
  paidAt: Date,
});

// Order Schema
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: function (items: IOrderItem[]) {
          return items.length > 0;
        },
        message: 'Đơn hàng phải có ít nhất một sản phẩm',
      },
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
    payment: {
      type: PaymentInfoSchema,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    voucherCode: String,
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    note: String,
    deliveryDate: Date,
    deliveryTimeSlot: String,
    isGift: {
      type: Boolean,
      default: false,
    },
    giftMessage: String,
    cancelReason: String,
    cancelledAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes (unique fields already have indexes via unique: true)
OrderSchema.index({ user: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'payment.status': 1 });
OrderSchema.index({ createdAt: -1 });
// Compound indexes for common queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1, createdAt: -1 });
OrderSchema.index({ user: 1, status: 1 });

// Generate order number before validation
OrderSchema.pre('validate', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const seq = await getNextSequence(`order-${year}${month}${day}`);
    this.orderNumber = `KL${year}${month}${day}${seq.toString().padStart(4, '0')}`;
  }
  next();
});

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
