import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import prisma from '../lib/prisma';

const generateSlug = (name: string) =>
  slugify(name, { lower: true, strict: true, locale: 'vi' });

const seedAll = async () => {
  try {
    console.log('Connecting to database...');

    // Clear all collections (respect order due to foreign keys if needed)
    // Using transaction for safety if desired, but separate deletes are fine for seeding
    await prisma.voucherUsage.deleteMany({});
    await prisma.stockReservation.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productSize.deleteMany({});
    await prisma.flashSaleProduct.deleteMany({});
    await prisma.flashSale.deleteMany({});
    await prisma.userActivity.deleteMany({});
    await prisma.pointTransaction.deleteMany({});
    await prisma.loyaltyAccount.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.voucher.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.themeConfig.deleteMany({});

    console.log('Cleared all tables');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const userHashedPassword = await bcrypt.hash('user123', 10);
    const managerHashedPassword = await bcrypt.hash('manager123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@klelite.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: "KL'élite",
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created admin user:', admin.email);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: userHashedPassword,
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        phone: '0901234567',
        role: 'USER',
        isVerified: true,
        isActive: true,
        addresses: {
          create: [
            {
              fullName: 'Nguyễn Văn A',
              phone: '0901234567',
              address: '123 Nguyễn Huệ',
              ward: 'Phường Bến Nghé',
              district: 'Quận 1',
              city: 'Hồ Chí Minh',
              isDefault: true,
            },
          ],
        },
      },
    });
    console.log('Created test user:', testUser.email);

    // Create manager user
    const manager = await prisma.user.create({
      data: {
        email: 'manager@klelite.com',
        password: managerHashedPassword,
        firstName: 'Manager',
        lastName: "KL'élite",
        phone: '0909876543',
        role: 'STAFF', // Using STAFF role for manager
        isVerified: true,
        isActive: true,
      },
    });
    console.log('Created manager user:', manager.email);

    // Create categories
    const categoryData = [
      { name: 'Bánh Sinh Nhật', description: 'Bánh sinh nhật cao cấp', order: 1 },
      { name: 'Bánh Cưới', description: 'Bánh cưới sang trọng', order: 2 },
      { name: 'Bánh Ngọt', description: 'Các loại bánh ngọt Pháp', order: 3 },
      { name: 'Bánh Mì', description: 'Bánh mì tươi mỗi ngày', order: 4 },
      { name: 'Chocolate', description: 'Chocolate thủ công cao cấp', order: 5 },
      { name: 'Quà Tặng', description: 'Hộp quà tặng sang trọng', order: 6 },
    ].map((cat) => ({ ...cat, slug: generateSlug(cat.name) }));

    for (const cat of categoryData) {
      await prisma.category.create({ data: cat });
    }

    const categories = await prisma.category.findMany();
    console.log(`Created ${categories.length} categories`);

    const categoryMap = new Map(categories.map((cat) => [cat.slug, cat.id]));

    // Products
    const productData = [
      // 1–10: Bánh Sinh Nhật
      {
        name: 'Royal Chocolate Dream',
        description: 'Bánh chocolate cao cấp với lớp ganache Valrhona đậm đà',
        price: 1200000,
        comparePrice: 1500000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
            publicId: 'img1',
            isMain: true,
          },
        ],
        sku: 'BSNCL001',
        stock: 50,
        rating: 4.9,
        numReviews: 128,
        isFeatured: true,
      },
      {
        name: 'Elegant White Rose',
        description: 'Bánh sinh nhật thanh lịch với hoa hồng trắng handmade',
        price: 950000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800',
            publicId: 'img2',
            isMain: true,
          },
        ],
        sku: 'BSNCL002',
        stock: 30,
        rating: 4.8,
        numReviews: 85,
        isFeatured: true,
      },
      {
        name: 'Strawberry Garden',
        description: 'Bánh sinh nhật dâu tây tươi với lớp kem phô mai mascarpone mịn mượt',
        price: 880000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
            publicId: 'img3',
            isMain: true,
          },
        ],
        sku: 'BSNCL003',
        stock: 40,
        rating: 4.8,
        numReviews: 96,
        isFeatured: true,
        isNewProduct: true,
      },
      {
        name: 'Matcha Sakura',
        description: 'Bánh matcha Nhật với lớp mousse sakura thanh nhẹ',
        price: 920000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            publicId: 'img4',
            isMain: true,
          },
        ],
        sku: 'BSNCL004',
        stock: 35,
        rating: 4.7,
        numReviews: 73,
      },
      {
        name: 'Caramel Salted Deluxe',
        description: 'Bánh caramel muối với nhân hạnh nhân rang bơ giòn',
        price: 990000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
            publicId: 'img5',
            isMain: true,
          },
        ],
        sku: 'BSNCL005',
        stock: 32,
        rating: 4.9,
        numReviews: 81,
        isFeatured: true,
      },
      {
        name: 'Black Forest Cherry',
        description: 'Bánh Black Forest với anh đào ngâm rượu rum',
        price: 930000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=800',
            publicId: 'img6',
            isMain: true,
          },
        ],
        sku: 'BSNCL006',
        stock: 28,
        rating: 4.8,
        numReviews: 64,
      },
      {
        name: 'Tiramisu Signature',
        description: 'Tiramisu công thức độc quyền với rượu Kahlúa',
        price: 870000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            publicId: 'img7',
            isMain: true,
          },
        ],
        sku: 'BSNCL007',
        stock: 45,
        rating: 4.9,
        numReviews: 152,
        isFeatured: true,
      },
      {
        name: 'Red Velvet Cream Cheese',
        description: 'Bánh Red Velvet với kem phô mai béo mịn',
        price: 910000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
            publicId: 'img8',
            isMain: true,
          },
        ],
        sku: 'BSNCL008',
        stock: 38,
        rating: 4.8,
        numReviews: 119,
      },
      {
        name: 'Mango Passion Mousse',
        description: 'Bánh mousse xoài và passion fruit vị nhiệt đới tươi mát',
        price: 890000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
            publicId: 'img9',
            isMain: true,
          },
        ],
        sku: 'BSNCL009',
        stock: 36,
        rating: 4.7,
        numReviews: 77,
        isNewProduct: true,
      },
      {
        name: 'Dark Chocolate Orange',
        description: 'Bánh chocolate đen 70% với mứt vỏ cam',
        price: 950000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
            publicId: 'img10',
            isMain: true,
          },
        ],
        sku: 'BSNCL010',
        stock: 30,
        rating: 4.9,
        numReviews: 102,
      },
    ];

    for (const prod of productData) {
      const { images, ...rest } = prod;
      await prisma.product.create({
        data: {
          ...rest,
          slug: generateSlug(rest.name),
          images: {
            create: images,
          },
        },
      });
    }
    console.log('Created initial products');

    // Create vouchers
    await prisma.voucher.createMany({
      data: [
        {
          code: 'WELCOME10',
          description: 'Giảm 10% cho đơn hàng đầu tiên',
          type: 'PERCENTAGE',
          value: 10,
          maxDiscount: 100000,
          minOrderValue: 200000,
          usageLimit: 1000,
          userLimit: 1,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
          code: 'FREESHIP',
          description: 'Miễn phí vận chuyển',
          type: 'FIXED_AMOUNT',
          value: 30000,
          minOrderValue: 300000,
          usageLimit: -1,
          userLimit: 5,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    console.log(`Created vouchers`);

    // Create default theme
    const defaultTheme = await prisma.themeConfig.create({
      data: {
        isActive: true,
        name: 'Default Luxury',
        type: 'LIGHT',
        header: {
          variant: 'transparent'
        },
        hero: {
          title: "KL'élite Luxury Bakery",
          subtitle: "Experience the Taste of Elegance",
          ctaText: "Shop Now",
          ctaLink: "/products",
          backgroundImage: "https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=2057&auto=format&fit=crop",
          overlayOpacity: 0.3
        }
      }
    });
    console.log('Created default theme:', defaultTheme.name);

    console.log('\n===========================================');
    console.log('Database seeded successfully!');
    console.log('===========================================');
    console.log('\nTest credentials:');
    console.log('Admin: admin@klelite.com / admin123');
    console.log('Manager: manager@klelite.com / manager123');
    console.log('User: user@test.com / user123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAll();
