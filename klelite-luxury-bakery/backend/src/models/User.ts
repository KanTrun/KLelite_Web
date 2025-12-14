import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import Cart from './Cart';

// Interfaces
export interface IAddress {
  fullName: string;
  phone: string;
  address: string;
  ward?: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'manager';
  addresses: IAddress[];
  wishlist: mongoose.Types.ObjectId[];
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpire?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateVerificationToken(): string;
  generateResetPasswordToken(): string;
}

interface IUserModel extends Model<IUser> {
  // Static methods if needed
}

// Address Schema
const AddressSchema = new Schema<IAddress>({
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    match: [/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ'],
  },
  address: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ'],
    trim: true,
  },
  ward: {
    type: String,
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'Vui lòng nhập quận/huyện'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'Vui lòng nhập thành phố'],
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

// User Schema
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Email không hợp lệ',
      ],
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values
    },
    firstName: {
      type: String,
      required: [true, 'Vui lòng nhập tên'],
      trim: true,
      maxlength: [50, 'Tên không được quá 50 ký tự'],
    },
    lastName: {
      type: String,
      required: [true, 'Vui lòng nhập họ'],
      trim: true,
      maxlength: [50, 'Họ không được quá 50 ký tự'],
    },
    phone: {
      type: String,
      match: [/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ'],
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'manager'],
      default: 'user',
    },
    addresses: [AddressSchema],
    wishlist: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.lastName} ${this.firstName}`;
});

// Index - only non-unique indexes (unique fields already have indexes)
UserSchema.index({ createdAt: -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Cascade delete cart and clean wishlist references
UserSchema.pre('deleteOne', { document: false, query: true }, async function(next) {
  const userId = this.getQuery()._id;

  try {
    // Delete user's cart
    await Cart.deleteOne({ user: userId });

    // Clean wishlist references
    await mongoose.model('User').updateMany(
      { wishlist: userId },
      { $pull: { wishlist: userId } }
    );

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
UserSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire } as jwt.SignOptions
  );
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function (): string {
  const refreshToken = jwt.sign(
    { id: this._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire } as jwt.SignOptions
  );
  this.refreshToken = refreshToken;
  return refreshToken;
};

// Generate verification token
UserSchema.methods.generateVerificationToken = function (): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken;
};

// Generate reset password token
UserSchema.methods.generateResetPasswordToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  return resetToken;
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;
