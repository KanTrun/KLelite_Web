import mongoose, { Document, Schema } from 'mongoose';

export interface IVoucher extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  userLimit: number;
  usedByUsers: mongoose.Types.ObjectId[];
  applicableCategories: mongoose.Types.ObjectId[];
  applicableProducts: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: [true, 'Vui lòng nhập mã voucher'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Mã voucher không được quá 20 ký tự'],
    },
    description: {
      type: String,
      required: [true, 'Vui lòng nhập mô tả voucher'],
      maxlength: [500, 'Mô tả không được quá 500 ký tự'],
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Vui lòng chọn loại voucher'],
    },
    value: {
      type: Number,
      required: [true, 'Vui lòng nhập giá trị voucher'],
      min: [0, 'Giá trị không được âm'],
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    userLimit: {
      type: Number,
      default: 1, // Times each user can use
    },
    usedByUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    applicableCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }],
    applicableProducts: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    startDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày bắt đầu'],
    },
    endDate: {
      type: Date,
      required: [true, 'Vui lòng chọn ngày kết thúc'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (unique fields already have indexes via unique: true)
VoucherSchema.index({ startDate: 1, endDate: 1 });
VoucherSchema.index({ isActive: 1 });

// Validate end date is after start date
VoucherSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    const error = new Error('Ngày kết thúc phải sau ngày bắt đầu');
    return next(error);
  }
  next();
});

// Method to check if voucher is valid
VoucherSchema.methods.isValid = function (userId?: string, orderTotal?: number): { valid: boolean; message: string } {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, message: 'Voucher đã bị vô hiệu hóa' };
  }
  
  // Check dates
  if (now < this.startDate) {
    return { valid: false, message: 'Voucher chưa đến thời gian sử dụng' };
  }
  
  if (now > this.endDate) {
    return { valid: false, message: 'Voucher đã hết hạn' };
  }
  
  // Check usage limit
  if (this.usageLimit !== -1 && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Voucher đã hết lượt sử dụng' };
  }
  
  // Check user limit
  if (userId) {
    const userUsageCount = this.usedByUsers.filter(
      (id: mongoose.Types.ObjectId) => id.toString() === userId
    ).length;
    
    if (userUsageCount >= this.userLimit) {
      return { valid: false, message: 'Bạn đã sử dụng hết lượt của voucher này' };
    }
  }
  
  // Check minimum order value
  if (orderTotal !== undefined && orderTotal < this.minOrderValue) {
    return { 
      valid: false, 
      message: `Đơn hàng tối thiểu ${this.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng voucher này` 
    };
  }
  
  return { valid: true, message: 'Voucher hợp lệ' };
};

// Method to calculate discount
VoucherSchema.methods.calculateDiscount = function (orderTotal: number): number {
  let discount = 0;
  
  if (this.type === 'percentage') {
    discount = (orderTotal * this.value) / 100;
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.value;
  }
  
  // Discount cannot exceed order total
  return Math.min(discount, orderTotal);
};

const Voucher = mongoose.model<IVoucher>('Voucher', VoucherSchema);

export default Voucher;
