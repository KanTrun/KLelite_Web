import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// Interfaces
export interface ICartItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  size?: string;
  customization?: string;
  price: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartDocument extends ICart, Document {}

// Cart Item Schema
const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng tối thiểu là 1'],
    default: 1,
  },
  size: String,
  customization: String,
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Cart Schema
const CartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index (user already has unique index via unique: true)
// No additional indexes needed

// Calculate totals before saving
CartSchema.pre('save', function (this: ICartDocument) {
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalPrice = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
});

const Cart: Model<ICartDocument> = mongoose.model<ICartDocument>('Cart', CartSchema);

export default Cart;
