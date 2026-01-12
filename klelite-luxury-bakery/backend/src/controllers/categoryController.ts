import { Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler, successResponse, createdResponse, NotFoundError, parsePagination, generatePaginationInfo } from '../utils';
import { AuthRequest } from '../types';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null
    },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { products: true }
      }
    },
    orderBy: { order: 'asc' }
  });

  successResponse(res, categories);
});

// @desc    Get all categories (admin - includes inactive)
// @route   GET /api/categories/all
// @access  Private/Admin
export const getAllCategories = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const { skip, limit, page } = parsePagination(req.query);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { order: 'asc' },
      skip,
      take: limit
    }),
    prisma.category.count()
  ]);

  const pagination = generatePaginationInfo(page, limit, total);

  successResponse(res, categories, undefined, 200, pagination);
});

// @desc    Get single category
// @route   GET /api/categories/:slug
// @access  Public
export const getCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await prisma.category.findFirst({
    where: {
      slug: req.params.slug,
      isActive: true
    },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { products: true }
      }
    }
  });

  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }

  successResponse(res, category);
});

// @desc    Get category by ID
// @route   GET /api/categories/id/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }

  successResponse(res, category);
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await prisma.category.create({
    data: req.body
  });

  createdResponse(res, category, 'Tạo danh mục thành công');
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  let category = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }

  category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body
  });

  successResponse(res, category, 'Cập nhật danh mục thành công');
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id }
  });

  if (!category) {
    throw NotFoundError('Không tìm thấy danh mục');
  }

  // Check for subcategories
  const subcategoryCount = await prisma.category.count({
    where: { parentId: req.params.id }
  });

  if (subcategoryCount > 0) {
    throw NotFoundError('Không thể xóa danh mục có danh mục con');
  }

  await prisma.category.delete({
    where: { id: req.params.id }
  });

  successResponse(res, null, 'Xóa danh mục thành công');
});
