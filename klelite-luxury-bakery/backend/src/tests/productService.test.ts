import { productService, CreateProductDTO, UpdateProductDTO } from '../services/productService';
import prisma from '../lib/prisma';
import { Product, Prisma, PrismaClient, Decimal } from '@prisma/client';

// Mock the entire prisma client
jest.mock('../lib/prisma', () => ({
  product: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  // Add other models if necessary that are used by productService
}));

const mockProduct: Product = {
  id: 'prod1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'This is a test product description.',
  shortDescription: 'Short description',
  price: new Decimal(100),
  comparePrice: new Decimal(120),
  sku: 'SKU123',
  stock: 50,
  categoryId: 'cat1',
  isFeatured: false,
  isAvailable: true,
  isNewProduct: true,
  ingredients: ['flour', 'sugar'],
  allergens: ['gluten'],
  nutrition: Prisma.JsonNull,
  tags: ['sweet', 'bakery'],
  preparationTime: 30,
  shelfLife: '3 days',
  storageInstructions: 'Keep refrigerated',
  customizable: false,
  customizationOptions: Prisma.JsonNull,
  rating: new Decimal(4.5),
  numReviews: 10,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockImage = {
  id: 'img1',
  url: 'http://example.com/image.jpg',
  publicId: 'public_id_1',
  isMain: true,
  productId: 'prod1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSize = {
  id: 'size1',
  name: 'Small',
  price: new Decimal(100),
  comparePrice: new Decimal(120),
  productId: 'prod1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.product.create as jest.Mock).mockResolvedValue({
        ...mockProduct,
        images: [mockImage],
        sizes: [mockSize],
      });

      const newProductData: CreateProductDTO = {
        name: 'New Product',
        slug: 'new-product',
        description: 'New description',
        price: 150,
        categoryId: 'cat1',
        images: [{ url: 'http://example.com/new.jpg' }],
        sizes: [{ name: 'Medium', price: 150 }],
      };

      const result = await productService.createProduct(newProductData);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { slug: 'new-product' } });
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Product',
            images: {
              create: [{ url: 'http://example.com/new.jpg' }]
            },
            sizes: {
              create: [{ name: 'Medium', price: 150 }]
            }
          }),
          include: {
            images: true,
            sizes: true,
            category: true,
          },
        })
      );
      expect(result).toEqual({ ...mockProduct, images: [mockImage], sizes: [mockSize] });
    });

    it('should throw an error if product with slug already exists', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const newProductData: CreateProductDTO = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Existing description',
        price: 100,
      };

      await expect(productService.createProduct(newProductData)).rejects.toThrow(
        'Product with this slug already exists'
      );
      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { slug: 'test-product' } });
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllProducts', () => {
    it('should return all products with pagination and no filters', async () => {
      const mockProductsList = [{ ...mockProduct, id: 'p1' }, { ...mockProduct, id: 'p2', slug: 'p2' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await productService.getAllProducts({});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { AND: [{}, {}, {}, {}, {}, {}] }, // Empty filter objects
          include: expect.any(Object),
        })
      );
      expect(prisma.product.count).toHaveBeenCalledWith(expect.any(Object));
      expect(result.products).toEqual(mockProductsList);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pages).toBe(1);
    });

    it('should filter products by search term', async () => {
      const mockProductsList = [{ ...mockProduct, name: 'Search Product' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await productService.getAllProducts({ search: 'Search' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { OR: [{ name: { contains: 'Search' } }, { description: { contains: 'Search' } }] },
              {}, {}, {}, {}, {}
            ]
          },
        })
      );
      expect(result.products).toEqual(mockProductsList);
    });

    it('should filter products by categoryId', async () => {
      const mockProductsList = [{ ...mockProduct, categoryId: 'cat2' }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await productService.getAllProducts({ categoryId: 'cat2' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [{}, { categoryId: 'cat2' }, {}, {}, {}, {}]
          },
        })
      );
      expect(result.products).toEqual(mockProductsList);
    });

    it('should sort products by price ascending', async () => {
      const mockProductsList = [{ ...mockProduct, price: 50 }, { ...mockProduct, price: 100 }];
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await productService.getAllProducts({ sort: 'price_asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
      expect(result.products).toEqual(mockProductsList);
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById('prod1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod1' },
          include: expect.any(Object),
        })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should return null if product not found by ID', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await productService.getProductById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getProductBySlug', () => {
    it('should return a product by slug', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductBySlug('test-product');

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'test-product' },
          include: expect.any(Object),
        })
      );
      expect(result).toEqual(mockProduct);
    });

    it('should return null if product not found by slug', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await productService.getProductBySlug('nonexistent-slug');

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updatedData: UpdateProductDTO = { name: 'Updated Product Name', price: 110 };
      (prisma.product.update as jest.Mock).mockResolvedValue({ ...mockProduct, ...updatedData });

      const result = await productService.updateProduct('prod1', updatedData);

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod1' },
          data: updatedData,
          include: expect.any(Object),
        })
      );
      expect(result).toEqual({ ...mockProduct, ...updatedData });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.deleteProduct('prod1');

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod1' } });
      expect(result).toEqual(mockProduct);
    });
  });
});
