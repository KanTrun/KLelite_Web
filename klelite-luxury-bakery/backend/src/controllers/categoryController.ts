import { Response, NextFunction } from 'express';
import Category from '../models/Category';
import { asyncHandler, successResponse, createdResponse, NotFoundError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const categories = await Category.find({ isActive: true, parent: null })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { order: 1 } },
    })
    .populate('productsCount')
    .sort({ order: 1 });
  
  successResponse(res, categories);
});

// @desc    Get all categories (admin - includes inactive)
// @route   GET /api/categories/all
// @access  Private/Admin
export const getAllCategories = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page } = parsePagination(req.query);
  
  const [categories, total] = await Promise.all([
    Category.find()
      .populate('productsCount')
      .sort({ order: 1 })
      .skip(skip)
      .limit(limit),
    Category.countDocuments(),
  ]);
  
  const pagination = generatePaginationInfo(page, limit, total);
  
  successResponse(res, categories, undefined, 200, pagination);
});

// @desc    Get single category
// @route   GET /api/categories/:slug
// @access  Public
export const getCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      options: { sort: { order: 1 } },
    })
    .populate('productsCount');
  
  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }
  
  successResponse(res, category);
});

// @desc    Get category by ID
// @route   GET /api/categories/id/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await Category.findById(req.params.id)
    .populate('productsCount');
  
  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }
  
  successResponse(res, category);
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await Category.create(req.body);
  
  createdResponse(res, category, 'Tạo danh mục thành công');
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let category = await Category.findById(req.params.id);
  
  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }
  
  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  
  successResponse(res, category, 'Cập nhật danh mục thành công');
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }
  
  // Check for subcategories
  const hasSubcategories = await Category.exists({ parent: req.params.id });
  if (hasSubcategories) {
    throw NotFoundError('Không thể xóa danh mục có danh mục con');
  }
  
  await category.deleteOne();
  
  successResponse(res, null, 'Xóa danh mục thành công');
});
