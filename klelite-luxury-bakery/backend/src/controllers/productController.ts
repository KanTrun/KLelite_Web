import { Response, NextFunction } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest, ProductFilters } from '../types';
import cloudinary from '../config/cloudinary';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort } = parsePagination(req.query);
  
  // Build filter query
  // isAvailable: true means the product is "Published".
  // We do NOT filter by stock here, so out-of-stock items (stock: 0) will still appear
  // as long as they are published. Frontend should handle "Out of Stock" display.
  const filter: Record<string, unknown> = { isAvailable: true };
  
  // Category filter
  if (req.query.category) {
    const category = await Category.findOne({ slug: req.query.category });
    if (category) {
      filter.category = category._id;
    }
  }
  
  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) {
      (filter.price as Record<string, number>).$gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      (filter.price as Record<string, number>).$lte = Number(req.query.maxPrice);
    }
  }
  
  // Search filter
  if (req.query.search) {
    filter.$text = { $search: req.query.search as string };
  }
  
  // Featured filter
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }
  
  // Tags filter
  if (req.query.tags) {
    const tags = (req.query.tags as string).split(',');
    filter.tags = { $in: tags };
  }
  
  // Execute query
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, products, undefined, 200, pagination);
});

import UserActivity from '../models/UserActivity';

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug price images rating');

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Track user activity
  if (req.user) {
    await UserActivity.create({
      userId: req.user._id,
      productId: product._id,
      activityType: 'view'
    }).catch(err => console.error('Error tracking user activity:', err));
  }

  successResponse(res, product);
});

// @desc    Get product by ID
// @route   GET /api/products/id/:id
// @access  Public
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug price images rating');
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  successResponse(res, product);
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await Product.find({ isFeatured: true, isAvailable: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  successResponse(res, products);
});

// @desc    Get new products
// @route   GET /api/products/new
// @access  Public
export const getNewProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await Product.find({ isNew: true, isAvailable: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit);
  
  successResponse(res, products);
});

// @desc    Get bestseller products
// @route   GET /api/products/bestsellers
// @access  Public
export const getBestsellerProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;
  
  const products = await Product.find({ isAvailable: true })
    .populate('category', 'name slug')
    .sort({ sold: -1 })
    .limit(limit);
  
  successResponse(res, products);
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.create(req.body);
  
  createdResponse(res, product, 'Tạo sản phẩm thành công');
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  successResponse(res, product, 'Cập nhật sản phẩm thành công');
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  // Delete images from cloudinary
  for (const image of product.images) {
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  }
  
  await product.deleteOne();
  
  successResponse(res, null, 'Xóa sản phẩm thành công');
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
export const uploadProductImages = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw BadRequestError('Vui lòng chọn ảnh để upload');
  }
  
  const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: 'klelite/products',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
        ],
      }
    );
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      isMain: product.images.length === 0,
    };
  });
  
  const newImages = await Promise.all(uploadPromises);
  product.images.push(...newImages);
  await product.save();
  
  successResponse(res, product.images, 'Upload ảnh thành công');
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
export const deleteProductImage = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  const image = product.images.find(img => img._id?.toString() === req.params.imageId);
  
  if (!image) {
    throw NotFoundError('Không tìm thấy ảnh');
  }
  
  // Delete from cloudinary
  if (image.publicId) {
    await cloudinary.uploader.destroy(image.publicId);
  }
  
  // Remove from product
  product.images = product.images.filter(img => img._id?.toString() !== req.params.imageId);
  
  // Set new main image if needed
  if (image.isMain && product.images.length > 0) {
    product.images[0].isMain = true;
  }
  
  await product.save();
  
  successResponse(res, product.images, 'Xóa ảnh thành công');
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const addProductReview = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { rating, comment } = req.body;
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (review) => review.user.toString() === req.user?._id.toString()
  );
  
  if (alreadyReviewed) {
    throw BadRequestError('Bạn đã đánh giá sản phẩm này rồi');
  }
  
  const review = {
    user: req.user!._id,
    rating: Number(rating),
    comment,
    isVerified: false,
  };
  
  product.reviews.push(review as any);
  
  // Update rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = Math.round((totalRating / product.reviews.length) * 10) / 10;
  product.numReviews = product.reviews.length;
  
  await product.save();
  
  createdResponse(res, product.reviews[product.reviews.length - 1], 'Đánh giá thành công');
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page } = parsePagination(req.query);
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }
  
  const total = product.reviews.length;
  const reviews = product.reviews
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(skip, skip + limit);
  
  await Product.populate(reviews, { path: 'user', select: 'firstName lastName avatar' });
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, reviews, undefined, 200, pagination);
});
