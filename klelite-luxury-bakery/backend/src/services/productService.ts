import { Product, Prisma, Category, Review, ProductImage, ProductSize } from '@prisma/client';
import prisma from '../lib/prisma';

export interface CreateProductDTO {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  sku?: string;
  stock?: number;
  categoryId?: string;
  isFeatured?: boolean;
  isAvailable?: boolean;
  isNewProduct?: boolean;
  ingredients?: string[];
  allergens?: string[];
  nutrition?: any;
  tags?: string[];
  preparationTime?: number;
  shelfLife?: string;
  storageInstructions?: string;
  customizable?: boolean;
  customizationOptions?: string[];
  images?: {
    url: string;
    publicId?: string;
    isMain?: boolean;
  }[];
  sizes?: {
    name: string;
    price: number;
    comparePrice?: number;
  }[];
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}

export interface ProductFilterDTO {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isAvailable?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
}

export const productService = {
  /**
   * Create a new product with relations (images, sizes)
   */
  async createProduct(data: CreateProductDTO): Promise<Product> {
    const { images, sizes, ...productData } = data;

    // Check if slug exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existingProduct) {
      throw new Error('Product with this slug already exists');
    }

    const createData: Prisma.ProductCreateInput = {
      ...productData,
      images: images && images.length > 0 ? {
        create: images
      } : undefined,
      sizes: sizes && sizes.length > 0 ? {
        create: sizes
      } : undefined,
    };

    return prisma.product.create({
      data: createData,
      include: {
        images: true,
        sizes: true,
        category: true,
      },
    });
  },

  /**
   * Get all products with filtering and pagination
   */
  async getAllProducts(filters: ProductFilterDTO) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      isFeatured,
      isAvailable,
      sort
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        } : {},
        categoryId ? { categoryId } : {},
        minPrice ? { price: { gte: minPrice } } : {},
        maxPrice ? { price: { lte: maxPrice } } : {},
        isFeatured !== undefined ? { isFeatured } : {},
        isAvailable !== undefined ? { isAvailable } : {},
      ]
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'rating') orderBy = { rating: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: true,
          category: {
            select: { name: true, slug: true }
          },
          sizes: true,
        },
      }),
      prisma.product.count({ where })
    ]);

    return {
      products,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        sizes: true,
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
    });
  },

  /**
   * Get product by Slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        sizes: true,
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
    });
  },

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    const { images, sizes, ...productData } = data;

    // Handle nested updates/upserts/deletes properly in a real app
    // For simplicity here, we'll just update scalar fields
    // and rely on specific endpoints/logic for adding/removing images/sizes if needed
    // OR we could wipe and replace images/sizes if provided (risky)

    // Simple update for scalars
    return prisma.product.update({
      where: { id },
      data: productData,
      include: {
        images: true,
        sizes: true,
        category: true
      }
    });
  },

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
};
