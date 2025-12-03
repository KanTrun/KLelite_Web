import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { config } from '../config';
import { asyncHandler, successResponse, createdResponse, UnauthorizedError, BadRequestError, NotFoundError, ConflictError } from '../utils';
import { sendEmail, emailTemplates } from '../utils/email';
import { AuthRequest } from '../types';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(config.google?.clientId);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { email, password, firstName, lastName, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ConflictError('Email đã được sử dụng');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
  });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();
  await user.save();

  // Send verification email
  const verificationUrl = `${config.frontendUrl}/verify-email/${verificationToken}`;
  const emailContent = emailTemplates.verification(user.firstName, verificationUrl);
  
  try {
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch {
    // Don't fail registration if email fails
    console.warn('Failed to send verification email');
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Remove sensitive data
  const userResponse = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  };

  createdResponse(res, { user: userResponse, accessToken, refreshToken }, 'Đăng ký thành công');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw UnauthorizedError('Email hoặc mật khẩu không đúng');
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw UnauthorizedError('Email hoặc mật khẩu không đúng');
  }

  // Check if user is active
  if (!user.isActive) {
    throw UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  // Update last login
  user.lastLogin = new Date();
  
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // User response
  const userResponse = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    isVerified: user.isVerified,
    addresses: user.addresses,
  };

  successResponse(res, { user: userResponse, accessToken, refreshToken }, 'Đăng nhập thành công');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  // Clear refresh token in database
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  successResponse(res, null, 'Đăng xuất thành công');
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    throw UnauthorizedError('Refresh token không tồn tại');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
  } catch {
    throw UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
  }

  // Find user with matching refresh token
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw UnauthorizedError('Refresh token không hợp lệ');
  }

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();
  await user.save();

  // Set cookies
  setTokenCookies(res, accessToken, newRefreshToken);

  successResponse(res, { accessToken }, 'Token đã được làm mới');
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const user = await User.findById(req.user?._id).populate('wishlist');
  
  if (!user) {
    throw NotFoundError('Người dùng không tồn tại');
  }

  successResponse(res, user);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw BadRequestError('Token xác thực không hợp lệ hoặc đã hết hạn');
  }

  // Verify user
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpire = undefined;
  await user.save();

  successResponse(res, null, 'Email đã được xác thực thành công');
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    successResponse(res, null, 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu');
    return;
  }

  // Generate reset token
  const resetToken = user.generateResetPasswordToken();
  await user.save();

  // Send email
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
  const emailContent = emailTemplates.resetPassword(user.firstName, resetUrl);

  try {
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    throw BadRequestError('Không thể gửi email. Vui lòng thử lại sau');
  }

  successResponse(res, null, 'Email đặt lại mật khẩu đã được gửi');
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw BadRequestError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  successResponse(res, { accessToken }, 'Mật khẩu đã được đặt lại thành công');
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id).select('+password');
  if (!user) {
    throw NotFoundError('Người dùng không tồn tại');
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw UnauthorizedError('Mật khẩu hiện tại không đúng');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  successResponse(res, { accessToken }, 'Mật khẩu đã được cập nhật thành công');
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { credential } = req.body;

  if (!credential) {
    throw BadRequestError('Google credential is required');
  }

  // Verify Google token
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google?.clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw UnauthorizedError('Invalid Google credential');
  }

  if (!payload || !payload.email) {
    throw UnauthorizedError('Unable to get user info from Google');
  }

  const { email, given_name, family_name, picture, sub: googleId } = payload;

  // Handle cases where Google doesn't provide name parts
  // Some Google accounts may not have family_name or given_name
  let firstName = given_name || '';
  let lastName = family_name || '';
  
  // If both are empty, try to extract from email
  if (!firstName && !lastName) {
    const emailName = email.split('@')[0];
    firstName = emailName;
    lastName = 'User';
  } else if (!firstName) {
    // If only firstName is empty, use lastName as firstName
    firstName = lastName;
    lastName = 'User';
  } else if (!lastName) {
    // If only lastName is empty, set a default
    lastName = 'User';
  }

  // Find or create user
  let user = await User.findOne({ $or: [{ email }, { googleId }] });

  if (user) {
    // Update Google ID if not set
    if (!user.googleId) {
      user.googleId = googleId;
    }
    // Update avatar if user doesn't have one
    if (!user.avatar && picture) {
      user.avatar = picture;
    }
    user.lastLogin = new Date();
  } else {
    // Create new user
    user = await User.create({
      email,
      googleId,
      firstName: firstName,
      lastName: lastName,
      avatar: picture,
      isVerified: true, // Google accounts are already verified
      password: crypto.randomBytes(20).toString('hex'), // Random password for Google users
    });
  }

  // Check if user is active
  if (!user.isActive) {
    throw UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save();

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // User response
  const userResponse = {
    _id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    isVerified: user.isVerified,
    addresses: user.addresses,
  };

  successResponse(res, { user: userResponse, accessToken, refreshToken }, 'Đăng nhập thành công');
});

// Helper function to set token cookies
const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict' as const,
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: config.jwt.cookieExpire * 24 * 60 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};
