import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, createdResponse, NotFoundError, BadRequestError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest, ProductFilters } from '../types';
import cloudinary from '../config/cloudinary';
import { ActivityType } from '@prisma/client';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page, sort, sortField } = parsePagination(req.query);

  // Build filter query
  const filter: any = { isAvailable: true };

  // Category filter
  if (req.query.category) {
    const category = await prisma.category.findUnique({
      where: { slug: req.query.category as string }
    });
    if (category) {
      filter.categoryId = category.id;
    }
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) {
      filter.price.gte = Number(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      filter.price.lte = Number(req.query.maxPrice);
    }
  }

  // Search filter (MySQL full-text search or LIKE)
  if (req.query.search) {
    const searchTerm = req.query.search as string;
    filter.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  // Featured filter
  if (req.query.featured === 'true') {
    filter.isFeatured = true;
  }

  // Execute query
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: filter,
      orderBy: { [sortField]: sort },
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          where: { isMain: true },
          take: 1
        }
      }
    }),
    prisma.product.count({ where: filter }),
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, products, undefined, 200, pagination);
});

// @desc    Get single product
// @route   GET /api/products/:slug
// @access  Public
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: true,
      sizes: true,
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Track user activity
  if (req.user) {
    await prisma.userActivity.create({
      data: {
        userId: req.user.id,
        productId: product.id,
        activityType: ActivityType.VIEW_PRODUCT
      }
    }).catch(err => console.error('Error tracking user activity:', err));
  }

  successResponse(res, product);
});

// @desc    Get product by ID
// @route   GET /api/products/id/:id
// @access  Public
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: true,
      sizes: true
    }
  });

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

  const products = await prisma.product.findMany({
    where: { isFeatured: true, isAvailable: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  successResponse(res, products);
});

// @desc    Get new products
// @route   GET /api/products/new
// @access  Public
export const getNewProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;

  const products = await prisma.product.findMany({
    where: { isNewProduct: true, isAvailable: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  successResponse(res, products);
});

// @desc    Get bestseller products
// @route   GET /api/products/bestsellers
// @access  Public
export const getBestsellerProducts = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const limit = parseInt(req.query.limit as string) || 8;

  const products = await prisma.product.findMany({
    where: { isAvailable: true },
    orderBy: { sold: 'desc' },
    take: limit,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: {
        where: { isMain: true },
        take: 1
      }
    }
  });

  successResponse(res, products);
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  // Destructure to exclude relation fields that can't be set directly
  const { images, category, reviews, ...productData } = req.body;

  // Handle category connection if provided
  if (category) {
    productData.categoryId = typeof category === 'object' ? category.id : category;
  }

  const product = await prisma.product.create({
    data: productData
  });

  createdResponse(res, product, 'Tạo sản phẩm thành công');
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Destructure to exclude relation fields
  const { images, category, reviews, sizes, ...updateData } = req.body;

  // Map category to categoryId if present
  if (category) {
    updateData.categoryId = typeof category === 'object' ? category.id : category;
  }

  // Update product with scalar fields only
  const updatedProduct = await prisma.product.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      images: true,
      sizes: true
    }
  });

  successResponse(res, updatedProduct, 'Cập nhật sản phẩm thành công');
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      images: true
    }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Delete images from cloudinary
  for (const image of product.images) {
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  }

  await prisma.product.delete({
    where: { id: req.params.id }
  });

  successResponse(res, null, 'Xóa sản phẩm thành công');
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Private/Admin
export const uploadProductImages = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: true }
  });

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

    return prisma.productImage.create({
      data: {
        productId: product.id,
        url: result.secure_url,
        publicId: result.public_id,
        isMain: product.images.length === 0
      }
    });
  });

  const newImages = await Promise.all(uploadPromises);

  successResponse(res, newImages, 'Upload ảnh thành công');
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
export const deleteProductImage = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const image = await prisma.productImage.findUnique({
    where: { id: req.params.imageId }
  });

  if (!image || image.productId !== req.params.id) {
    throw NotFoundError('Không tìm thấy ảnh');
  }

  // Delete from cloudinary
  if (image.publicId) {
    await cloudinary.uploader.destroy(image.publicId);
  }

  // Delete from database
  await prisma.productImage.delete({
    where: { id: req.params.imageId }
  });

  // Set new main image if needed
  if (image.isMain) {
    const firstImage = await prisma.productImage.findFirst({
      where: { productId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });

    if (firstImage) {
      await prisma.productImage.update({
        where: { id: firstImage.id },
        data: { isMain: true }
      });
    }
  }

  const images = await prisma.productImage.findMany({
    where: { productId: req.params.id }
  });

  successResponse(res, images, 'Xóa ảnh thành công');
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const addProductReview = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { rating, comment } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      reviews: true
    }
  });

  if (!product) {
    throw NotFoundError('Không tìm thấy sản phẩm');
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (review) => review.userId === req.user!.id
  );

  if (alreadyReviewed) {
    throw BadRequestError('Bạn đã đánh giá sản phẩm này rồi');
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      productId: product.id,
      rating: Number(rating),
      comment,
      isVerified: false
    }
  });

  // Update product rating
  const allReviews = await prisma.review.findMany({
    where: { productId: product.id },
    select: { rating: true }
  });

  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      rating: avgRating,
      numReviews: allReviews.length
    }
  });

  createdResponse(res, review, 'Đánh giá thành công');
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page } = parsePagination(req.query);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId: req.params.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    }),
    prisma.review.count({
      where: { productId: req.params.id }
    })
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, reviews, undefined, 200, pagination);
});
