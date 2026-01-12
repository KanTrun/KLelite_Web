import slugify from 'slugify';
import prisma from '../lib/prisma';

const generateSlug = (name: string) =>
  slugify(name, { lower: true, strict: true, locale: 'vi' });

const seedProducts = async () => {
  try {
    console.log('Connecting to database...');

    // Get categories
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((cat) => [cat.slug, cat.id]));

    const productsData = [
      // Bánh Sinh Nhật
      {
        name: 'Royal Chocolate Dream',
        description: 'Bánh chocolate cao cấp với lớp ganache Valrhona đậm đà, được trang trí với lá vàng 24k và hoa tươi. Phù hợp cho các dịp sinh nhật đặc biệt.',
        shortDescription: 'Bánh chocolate cao cấp với ganache Valrhona',
        price: 1200000,
        comparePrice: 1500000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          { url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', publicId: 'chocolate-cake-1', isMain: true },
        ],
        sizes: [
          { name: '16cm (4-6 người)', price: 1200000 },
          { name: '20cm (8-10 người)', price: 1600000 },
          { name: '24cm (12-15 người)', price: 2200000 },
        ],
        ingredients: ['Bột mì Pháp', 'Chocolate Valrhona 70%', 'Bơ Président', 'Trứng gà ta', 'Kem tươi'],
        allergens: ['Gluten', 'Trứng', 'Sữa'],
        tags: ['bestseller', 'chocolate', 'luxury'],
        sku: 'BSNCL001',
        stock: 50,
        rating: 4.9,
        numReviews: 128,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: false,
        preparationTime: 24,
        shelfLife: '3 ngày (bảo quản lạnh)',
        storageInstructions: 'Bảo quản trong tủ lạnh 2-4°C',
        customizable: true,
        customizationOptions: ['Viết tên', 'Thay đổi vị kem', 'Thêm hoa tươi'],
      },
      {
        name: 'Vanilla Berry Garden',
        description: 'Bánh vanilla mềm mịn với lớp kem bơ nhẹ nhàng, được trang trí với các loại berry tươi theo mùa và hoa ăn được.',
        shortDescription: 'Bánh vanilla với berry tươi theo mùa',
        price: 980000,
        categoryId: categoryMap.get('banh-sinh-nhat'),
        images: [
          { url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800', publicId: 'vanilla-cake-1', isMain: true },
        ],
        sizes: [
          { name: '16cm (4-6 người)', price: 980000 },
          { name: '20cm (8-10 người)', price: 1380000 },
          { name: '24cm (12-15 người)', price: 1880000 },
        ],
        ingredients: ['Bột mì', 'Vanilla Madagascar', 'Bơ', 'Trứng', 'Kem tươi', 'Berry tươi'],
        allergens: ['Gluten', 'Trứng', 'Sữa'],
        tags: ['vanilla', 'berry', 'fresh'],
        sku: 'BSNVB002',
        stock: 40,
        rating: 4.8,
        numReviews: 95,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: true,
        preparationTime: 24,
        shelfLife: '2 ngày (bảo quản lạnh)',
        storageInstructions: 'Bảo quản trong tủ lạnh 2-4°C',
        customizable: true,
        customizationOptions: ['Viết tên', 'Đổi loại berry'],
      },

      // Bánh Ngọt
      {
        name: 'Croissant Bơ Pháp',
        description: 'Croissant truyền thống với 81 lớp bơ Pháp Isigny, giòn xốp bên ngoài và mềm mịn bên trong.',
        shortDescription: 'Croissant 81 lớp bơ Isigny',
        price: 65000,
        categoryId: categoryMap.get('banh-ngot'),
        images: [
          { url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', publicId: 'croissant-1', isMain: true },
        ],
        ingredients: ['Bột mì T55', 'Bơ Isigny AOP', 'Men tự nhiên', 'Muối biển'],
        allergens: ['Gluten', 'Sữa'],
        tags: ['croissant', 'french', 'classic'],
        sku: 'BNGCR001',
        stock: 100,
        rating: 4.9,
        numReviews: 256,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: false,
        preparationTime: 2,
        shelfLife: '1 ngày',
        storageInstructions: 'Sử dụng trong ngày để đạt hương vị tốt nhất',
      },
      {
        name: 'Pain au Chocolat',
        description: 'Bánh sừng bò chocolate với 2 thanh chocolate Valrhona bên trong, lớp vỏ giòn xốp.',
        shortDescription: 'Croissant với chocolate Valrhona',
        price: 75000,
        categoryId: categoryMap.get('banh-ngot'),
        images: [
          { url: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800', publicId: 'pain-chocolat-1', isMain: true },
        ],
        ingredients: ['Bột mì T55', 'Bơ Isigny', 'Chocolate Valrhona', 'Men tự nhiên'],
        allergens: ['Gluten', 'Sữa'],
        tags: ['chocolate', 'french', 'breakfast'],
        sku: 'BNGPC002',
        stock: 80,
        rating: 4.8,
        numReviews: 189,
        isFeatured: false,
        isAvailable: true,
        isNewProduct: false,
      },
      {
        name: 'Éclair Caramel Bơ Mặn',
        description: 'Éclair với lớp kem caramel bơ mặn Bretagne, phủ chocolate đen bóng.',
        shortDescription: 'Éclair caramel bơ mặn cao cấp',
        price: 85000,
        categoryId: categoryMap.get('banh-ngot'),
        images: [
          { url: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800', publicId: 'eclair-1', isMain: true },
        ],
        ingredients: ['Bột mì', 'Bơ Bretagne', 'Trứng', 'Đường', 'Cream', 'Chocolate'],
        allergens: ['Gluten', 'Trứng', 'Sữa'],
        tags: ['eclair', 'caramel', 'french'],
        sku: 'BNGEC003',
        stock: 60,
        rating: 4.7,
        numReviews: 112,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: true,
      },
      {
        name: 'Macaron Box 12',
        description: 'Hộp 12 macaron với các vị đặc trưng: Vanilla, Chocolate, Raspberry, Pistachio, Caramel, Lemon.',
        shortDescription: 'Hộp 12 macaron nhiều vị',
        price: 420000,
        categoryId: categoryMap.get('banh-ngot'),
        images: [
          { url: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800', publicId: 'macaron-box-1', isMain: true },
        ],
        ingredients: ['Bột hạnh nhân', 'Đường', 'Lòng trắng trứng', 'Các loại ganache'],
        allergens: ['Hạt', 'Trứng'],
        tags: ['macaron', 'gift', 'colorful'],
        sku: 'BNGMB004',
        stock: 30,
        rating: 4.9,
        numReviews: 78,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: false,
      },

      // Bánh Mì
      {
        name: 'Sourdough Rustic',
        description: 'Bánh mì men tự nhiên truyền thống, lên men 48 giờ, vỏ giòn, ruột xốp với hương vị chua nhẹ đặc trưng.',
        shortDescription: 'Bánh mì sourdough lên men 48h',
        price: 95000,
        categoryId: categoryMap.get('banh-mi'),
        images: [
          { url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', publicId: 'sourdough-1', isMain: true },
        ],
        ingredients: ['Bột mì hữu cơ', 'Men tự nhiên', 'Nước', 'Muối biển'],
        allergens: ['Gluten'],
        tags: ['sourdough', 'artisan', 'healthy'],
        sku: 'BMISD001',
        stock: 50,
        rating: 4.8,
        numReviews: 145,
        isFeatured: false,
        isAvailable: true,
        isNewProduct: false,
      },
      {
        name: 'Baguette Tradition',
        description: 'Baguette truyền thống Pháp với vỏ giòn tan, ruột mềm với nhiều lỗ khí.',
        shortDescription: 'Baguette Pháp truyền thống',
        price: 45000,
        categoryId: categoryMap.get('banh-mi'),
        images: [
          { url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800', publicId: 'baguette-1', isMain: true },
        ],
        ingredients: ['Bột mì T65', 'Men', 'Nước', 'Muối'],
        allergens: ['Gluten'],
        tags: ['baguette', 'french', 'daily'],
        sku: 'BMIBG002',
        stock: 100,
        rating: 4.7,
        numReviews: 203,
        isFeatured: false,
        isAvailable: true,
        isNewProduct: false,
      },

      // Chocolate
      {
        name: 'Truffle Collection',
        description: 'Bộ sưu tập 16 viên truffle chocolate thủ công với các vị: Dark, Milk, Champagne, Matcha, Earl Grey.',
        shortDescription: 'Hộp 16 truffle chocolate cao cấp',
        price: 580000,
        categoryId: categoryMap.get('chocolate'),
        images: [
          { url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800', publicId: 'truffle-1', isMain: true },
        ],
        ingredients: ['Chocolate Valrhona', 'Cream', 'Bơ', 'Các hương vị tự nhiên'],
        allergens: ['Sữa'],
        tags: ['truffle', 'gift', 'luxury'],
        sku: 'CHLTF001',
        stock: 25,
        rating: 5.0,
        numReviews: 42,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: true,
      },
      {
        name: 'Bonbon Signature Box',
        description: 'Hộp 9 bonbon chocolate with các vị đặc trưng of KL\'élite, được trang trí thủ công.',
        shortDescription: 'Hộp 9 bonbon chocolate signature',
        price: 380000,
        categoryId: categoryMap.get('chocolate'),
        images: [
          { url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800', publicId: 'bonbon-1', isMain: true },
        ],
        ingredients: ['Chocolate Bỉ', 'Cream', 'Praline', 'Hương liệu tự nhiên'],
        allergens: ['Sữa', 'Hạt'],
        tags: ['bonbon', 'signature', 'handmade'],
        sku: 'CHLBB002',
        stock: 35,
        rating: 4.9,
        numReviews: 67,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: false,
      },

      // Quà Tặng
      {
        name: 'Luxury Gift Box',
        description: 'Hộp quà tặng sang trọng bao gồm: 6 macaron, 6 truffle, 1 bánh nhỏ, được đóng gói trong hộp thiết kế cao cấp.',
        shortDescription: 'Hộp quà tặng cao cấp đầy đủ',
        price: 1280000,
        categoryId: categoryMap.get('qua-tang'),
        images: [
          { url: 'https://images.unsplash.com/photo-1513135065346-a098a63a71ee?w=800', publicId: 'gift-box-1', isMain: true },
        ],
        tags: ['gift', 'luxury', 'celebration'],
        sku: 'QTLGB001',
        stock: 20,
        rating: 5.0,
        numReviews: 35,
        isFeatured: true,
        isAvailable: true,
        isNewProduct: true,
      },
    ];

    // Clear existing products
    await prisma.product.deleteMany({});
    console.log('Cleared existing products');

    // Insert products one by one to handle relations (images and sizes)
    for (const prodData of productsData) {
      const { images, sizes, ...rest } = prodData;
      await prisma.product.create({
        data: {
          ...rest,
          slug: generateSlug(rest.name),
          images: {
            create: images,
          },
          ...(sizes && {
            sizes: {
              create: sizes,
            },
          }),
        },
      });
    }

    const createdCount = await prisma.product.count();
    console.log(`Created ${createdCount} products`);

    const allProducts = await prisma.product.findMany();
    allProducts.forEach((prod) => {
      console.log(`  - ${prod.name} (${prod.sku})`);
    });

    console.log('\nProducts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts();
