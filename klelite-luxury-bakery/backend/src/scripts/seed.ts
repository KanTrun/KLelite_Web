import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import { config } from '../config';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Voucher from '../models/Voucher';

// Helper function to generate slug
const generateSlug = (name: string) =>
  slugify(name, { lower: true, strict: true, locale: 'vi' });

const seedAll = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Voucher.deleteMany({}),
    ]);
    console.log('Cleared all collections');

    // Create admin user (password will be hashed by model pre-save hook)
    const admin = await User.create({
      email: 'admin@klelite.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: "KL'élite",
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log('Created admin user:', admin.email);

    // Create test user
    const testUser = await User.create({
      email: 'user@test.com',
      password: 'user123',
      firstName: 'Nguyễn',
      lastName: 'Văn A',
      phone: '0901234567',
      role: 'user',
      isVerified: true,
      isActive: true,
      addresses: [
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
    });
    console.log('Created test user:', testUser.email);

    // Create manager user
    const manager = await User.create({
      email: 'manager@klelite.com',
      password: 'manager123',
      firstName: 'Manager',
      lastName: "KL'élite",
      phone: '0909876543',
      role: 'manager',
      isVerified: true,
      isActive: true,
    });
    console.log('Created manager user:', manager.email);

    // Create categories with slugs
    const categoryData = [
      { name: 'Bánh Sinh Nhật', description: 'Bánh sinh nhật cao cấp', order: 1 },
      { name: 'Bánh Cưới', description: 'Bánh cưới sang trọng', order: 2 },
      { name: 'Bánh Ngọt', description: 'Các loại bánh ngọt Pháp', order: 3 },
      { name: 'Bánh Mì', description: 'Bánh mì tươi mỗi ngày', order: 4 },
      { name: 'Chocolate', description: 'Chocolate thủ công cao cấp', order: 5 },
      { name: 'Quà Tặng', description: 'Hộp quà tặng sang trọng', order: 6 },
    ].map((cat) => ({ ...cat, slug: generateSlug(cat.name) }));

    const categories = await Category.insertMany(categoryData);
    console.log(`Created ${categories.length} categories`);

    const categoryMap = new Map(categories.map((cat) => [cat.slug, cat._id]));

    // Create 50 products with slugs
    const productData = [
      // 1–10: Bánh Sinh Nhật
      {
        name: 'Royal Chocolate Dream',
        description: 'Bánh chocolate cao cấp với lớp ganache Valrhona đậm đà',
        price: 1200000,
        comparePrice: 1500000,
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        description:
          'Bánh sinh nhật dâu tây tươi với lớp kem phô mai mascarpone mịn mượt',
        price: 880000,
        category: categoryMap.get('banh-sinh-nhat'),
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
        isNew: true,
      },
      {
        name: 'Matcha Sakura',
        description: 'Bánh matcha Nhật với lớp mousse sakura thanh nhẹ',
        price: 920000,
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        category: categoryMap.get('banh-sinh-nhat'),
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
        isNew: true,
      },
      {
        name: 'Dark Chocolate Orange',
        description: 'Bánh chocolate đen 70% với mứt vỏ cam',
        price: 950000,
        category: categoryMap.get('banh-sinh-nhat'),
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

      // 11–20: Bánh Ngọt
      {
        name: 'Croissant Bơ Pháp',
        description: 'Croissant truyền thống với 81 lớp bơ Pháp Isigny',
        price: 65000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
            publicId: 'img11',
            isMain: true,
          },
        ],
        sku: 'BNGCR001',
        stock: 100,
        rating: 4.9,
        numReviews: 256,
        isFeatured: true,
      },
      {
        name: 'Pain au Chocolat',
        description: 'Bánh sừng bò chocolate với thanh socola Bỉ nguyên chất',
        price: 75000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800',
            publicId: 'img12',
            isMain: true,
          },
        ],
        sku: 'BNGPC001',
        stock: 80,
        rating: 4.7,
        numReviews: 142,
      },
      {
        name: 'Éclair Vanille',
        description: 'Bánh su que nhân kem vani Bourbon',
        price: 55000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
            publicId: 'img13',
            isMain: true,
          },
        ],
        sku: 'BNGEC001',
        stock: 120,
        rating: 4.7,
        numReviews: 134,
      },
      {
        name: 'Éclair Chocolate',
        description: 'Bánh su que chocolate với ganache đậm vị',
        price: 59000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=800',
            publicId: 'img14',
            isMain: true,
          },
        ],
        sku: 'BNGEC002',
        stock: 110,
        rating: 4.8,
        numReviews: 121,
      },
      {
        name: 'Macaron Collection 12pcs',
        description:
          'Hộp 12 chiếc macaron hương vị Pháp truyền thống nhiều màu sắc',
        price: 420000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            publicId: 'img15',
            isMain: true,
          },
        ],
        sku: 'BNGMC001',
        stock: 60,
        rating: 4.9,
        numReviews: 203,
        isFeatured: true,
        isNew: true,
      },
      {
        name: 'Financier Hạnh Nhân',
        description: 'Bánh hạnh nhân nướng bơ nâu thơm béo',
        price: 45000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
            publicId: 'img16',
            isMain: true,
          },
        ],
        sku: 'BNGFC001',
        stock: 150,
        rating: 4.6,
        numReviews: 89,
      },
      {
        name: 'Madeleine Bơ Vani',
        description: 'Madeleine vỏ giòn ruột mềm, thơm bơ vani',
        price: 39000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
            publicId: 'img17',
            isMain: true,
          },
        ],
        sku: 'BNGMD001',
        stock: 170,
        rating: 4.7,
        numReviews: 132,
      },
      {
        name: 'Cheesecake Chanh Dây',
        description: 'Cheesecake lạnh vị chanh dây tươi mát',
        price: 79000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
            publicId: 'img18',
            isMain: true,
          },
        ],
        sku: 'BNGCC001',
        stock: 90,
        rating: 4.9,
        numReviews: 178,
        isFeatured: true,
      },
      {
        name: 'Cheesecake Blueberry',
        description: 'Cheesecake nướng với mứt việt quất',
        price: 82000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
            publicId: 'img19',
            isMain: true,
          },
        ],
        sku: 'BNGCC002',
        stock: 85,
        rating: 4.8,
        numReviews: 147,
      },
      {
        name: 'Tart Trái Cây Nhiệt Đới',
        description: 'Đế tart bơ giòn đi kèm trái cây tươi theo mùa',
        price: 89000,
        category: categoryMap.get('banh-ngot'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
            publicId: 'img20',
            isMain: true,
          },
        ],
        sku: 'BNGTT001',
        stock: 95,
        rating: 4.8,
        numReviews: 166,
        isFeatured: true,
        isNew: true,
      },

      // 21–30: Chocolate
      {
        name: 'Truffle Collection',
        description: 'Bộ sưu tập 16 viên truffle chocolate thủ công',
        price: 580000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img21',
            isMain: true,
          },
        ],
        sku: 'CHLTF001',
        stock: 25,
        rating: 5.0,
        numReviews: 42,
        isFeatured: true,
        isNew: true,
      },
      {
        name: 'Single Origin Vietnam 72%',
        description: 'Chocolate đen single-origin cacao Bến Tre 72%',
        price: 210000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img22',
            isMain: true,
          },
        ],
        sku: 'CHLSO001',
        stock: 80,
        rating: 4.9,
        numReviews: 88,
        isFeatured: true,
      },
      {
        name: 'Milk Chocolate Hazelnut',
        description: 'Chocolate sữa hạt phỉ rang giòn',
        price: 195000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img23',
            isMain: true,
          },
        ],
        sku: 'CHLMH001',
        stock: 90,
        rating: 4.8,
        numReviews: 95,
      },
      {
        name: 'Ruby Chocolate Berry',
        description: 'Chocolate ruby mix trái cây mọng nước',
        price: 230000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img24',
            isMain: true,
          },
        ],
        sku: 'CHLRB001',
        stock: 70,
        rating: 4.7,
        numReviews: 61,
      },
      {
        name: 'Chocolate Bar Collection',
        description: 'Bộ 4 thanh chocolate tuyển chọn hương vị đặc biệt',
        price: 380000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img25',
            isMain: true,
          },
        ],
        sku: 'CHLCL001',
        stock: 50,
        rating: 4.9,
        numReviews: 77,
        isFeatured: true,
        isNew: true,
      },
      {
        name: 'Hot Chocolate Mix',
        description: 'Bột chocolate uống nóng công thức đặc biệt',
        price: 260000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img26',
            isMain: true,
          },
        ],
        sku: 'CHLHC001',
        stock: 65,
        rating: 4.8,
        numReviews: 84,
      },
      {
        name: 'Praline Nut Assortment',
        description: 'Hộp praline nhân hạt tổng hợp cao cấp',
        price: 420000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img27',
            isMain: true,
          },
        ],
        sku: 'CHLPR001',
        stock: 45,
        rating: 4.9,
        numReviews: 58,
      },
      {
        name: 'Dark Chocolate Truffle Box 24pcs',
        description: 'Hộp 24 viên truffle chocolate đen cao cấp',
        price: 720000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img28',
            isMain: true,
          },
        ],
        sku: 'CHLTF002',
        stock: 30,
        rating: 4.9,
        numReviews: 49,
      },
      {
        name: 'Almond Crunch Chocolate',
        description: 'Thanh chocolate giòn với hạnh nhân rang',
        price: 180000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img29',
            isMain: true,
          },
        ],
        sku: 'CHLAL001',
        stock: 75,
        rating: 4.8,
        numReviews: 72,
      },
      {
        name: 'Vegan Dark Chocolate 85%',
        description:
          'Chocolate đen 85% thuần chay không sữa, vị đậm nhưng ít đắng',
        price: 240000,
        category: categoryMap.get('chocolate'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800',
            publicId: 'img30',
            isMain: true,
          },
        ],
        sku: 'CHLVG001',
        stock: 55,
        rating: 4.7,
        numReviews: 41,
      },

      // 31–40: Bánh Mì
      {
        name: 'Bánh Mì Baguette',
        description: 'Bánh mì Pháp truyền thống, vỏ giòn ruột mềm',
        price: 35000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img31',
            isMain: true,
          },
        ],
        sku: 'BMBG001',
        stock: 200,
        rating: 4.6,
        numReviews: 312,
      },
      {
        name: 'Bánh Mì Sourdough',
        description: 'Bánh mì sourdough ủ lạnh 24h, vỏ nứt nghệ thuật',
        price: 82000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img32',
            isMain: true,
          },
        ],
        sku: 'BMSD001',
        stock: 90,
        rating: 4.9,
        numReviews: 141,
        isFeatured: true,
      },
      {
        name: 'Bánh Mì Hạt Ngũ Cốc',
        description: 'Bánh mì nguyên cám với hạt chia, yến mạch và hạt bí',
        price: 76000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img33',
            isMain: true,
          },
        ],
        sku: 'BMNGC001',
        stock: 95,
        rating: 4.8,
        numReviews: 129,
      },
      {
        name: 'Bánh Mì Ciabatta',
        description: 'Bánh mì Ý ciabatta xốp nhẹ, ruột rỗ khí',
        price: 68000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img34',
            isMain: true,
          },
        ],
        sku: 'BMCB001',
        stock: 110,
        rating: 4.7,
        numReviews: 104,
      },
      {
        name: 'Bánh Mì Bơ Tỏi',
        description: 'Bánh mì baguette phết bơ tỏi nướng thơm',
        price: 45000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img35',
            isMain: true,
          },
        ],
        sku: 'BMBT001',
        stock: 180,
        rating: 4.8,
        numReviews: 215,
        isFeatured: true,
      },
      {
        name: 'Bánh Mì Sữa Nhật',
        description: 'Bánh mì sữa mềm mịn kiểu Hokkaido',
        price: 52000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img36',
            isMain: true,
          },
        ],
        sku: 'BMSN001',
        stock: 160,
        rating: 4.9,
        numReviews: 198,
        isFeatured: true,
        isNew: true,
      },
      {
        name: 'Bánh Mì Brioche',
        description: 'Brioche bơ trứng béo mềm, thơm nhẹ',
        price: 69000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img37',
            isMain: true,
          },
        ],
        sku: 'BMBC001',
        stock: 140,
        rating: 4.8,
        numReviews: 176,
      },
      {
        name: 'Bánh Mì Focaccia Olive',
        description: 'Focaccia Ý với olive, cà chua bi và thảo mộc',
        price: 88000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img38',
            isMain: true,
          },
        ],
        sku: 'BMFC001',
        stock: 70,
        rating: 4.7,
        numReviews: 87,
      },
      {
        name: 'Bánh Mì Panini Ý',
        description: 'Bánh mì panini nướng giòn nhân phô mai và jambon',
        price: 98000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img39',
            isMain: true,
          },
        ],
        sku: 'BMPN001',
        stock: 65,
        rating: 4.8,
        numReviews: 79,
      },
      {
        name: 'Bánh Mì Mini Slider Set',
        description: 'Set 6 bánh mì mini slider cho tiệc cocktail',
        price: 145000,
        category: categoryMap.get('banh-mi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800',
            publicId: 'img40',
            isMain: true,
          },
        ],
        sku: 'BMSL001',
        stock: 50,
        rating: 4.7,
        numReviews: 63,
      },

      // 41–45: Bánh Cưới
      {
        name: 'Wedding Cake Classic',
        description: 'Bánh cưới 3 tầng phong cách cổ điển',
        price: 5500000,
        category: categoryMap.get('banh-cuoi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            publicId: 'img41',
            isMain: true,
          },
        ],
        sku: 'BCWC001',
        stock: 5,
        rating: 5.0,
        numReviews: 28,
        isFeatured: true,
      },
      {
        name: 'Wedding Cake Modern Marble',
        description: 'Bánh cưới phong cách marble hiện đại',
        price: 6200000,
        category: categoryMap.get('banh-cuoi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            publicId: 'img42',
            isMain: true,
          },
        ],
        sku: 'BCWC002',
        stock: 4,
        rating: 5.0,
        numReviews: 19,
        isFeatured: true,
      },
      {
        name: 'Wedding Cake Rustic',
        description: 'Bánh cưới phong cách rustic với hoa tươi',
        price: 5800000,
        category: categoryMap.get('banh-cuoi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            publicId: 'img43',
            isMain: true,
          },
        ],
        sku: 'BCWC003',
        stock: 6,
        rating: 4.9,
        numReviews: 21,
      },
      {
        name: 'Wedding Cake Gold Leaf',
        description: 'Bánh cưới phủ vàng 24K sang trọng',
        price: 7800000,
        category: categoryMap.get('banh-cuoi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            publicId: 'img44',
            isMain: true,
          },
        ],
        sku: 'BCWC004',
        stock: 3,
        rating: 5.0,
        numReviews: 11,
        isFeatured: true,
      },
      {
        name: 'Mini Wedding Set',
        description: 'Combo bánh cưới mini cho tiệc thân mật',
        price: 3600000,
        category: categoryMap.get('banh-cuoi'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
            publicId: 'img45',
            isMain: true,
          },
        ],
        sku: 'BCWC005',
        stock: 8,
        rating: 4.8,
        numReviews: 14,
        isNew: true,
      },

      // 46–50: Quà Tặng
      {
        name: 'Gift Box Premium',
        description: 'Hộp quà cao cấp gồm bánh và chocolate',
        price: 1200000,
        category: categoryMap.get('qua-tang'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'img46',
            isMain: true,
          },
        ],
        sku: 'QTGB001',
        stock: 40,
        rating: 4.9,
        numReviews: 67,
        isNew: true,
      },
      {
        name: 'Gift Box Classic',
        description: 'Hộp quà bánh ngọt tuyển chọn cho mọi dịp',
        price: 890000,
        category: categoryMap.get('qua-tang'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'img47',
            isMain: true,
          },
        ],
        sku: 'QTGB002',
        stock: 35,
        rating: 4.8,
        numReviews: 72,
      },
      {
        name: 'Gift Box Chocolate Lover',
        description: 'Hộp quà dành riêng cho tín đồ chocolate',
        price: 1250000,
        category: categoryMap.get('qua-tang'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'img48',
            isMain: true,
          },
        ],
        sku: 'QTGB003',
        stock: 28,
        rating: 4.9,
        numReviews: 64,
        isFeatured: true,
      },
      {
        name: 'Tea Time Hamper',
        description: 'Giỏ quà trà chiều gồm bánh, trà và mứt thủ công',
        price: 1350000,
        category: categoryMap.get('qua-tang'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'img49',
            isMain: true,
          },
        ],
        sku: 'QTGB004',
        stock: 22,
        rating: 4.8,
        numReviews: 39,
      },
      {
        name: 'New Year Celebration Box',
        description: 'Hộp quà Tết sang trọng phiên bản giới hạn',
        price: 1850000,
        category: categoryMap.get('qua-tang'),
        images: [
          {
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            publicId: 'img50',
            isMain: true,
          },
        ],
        sku: 'QTGB005',
        stock: 18,
        rating: 5.0,
        numReviews: 47,
        isFeatured: true,
        isNew: true,
      },
    ].map((prod) => ({ ...prod, slug: generateSlug(prod.name) }));

    const products = await Product.insertMany(productData);
    console.log(`Created ${products.length} products`);

    // Create vouchers
    const vouchers = await Voucher.insertMany([
      {
        code: 'WELCOME10',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        type: 'percentage',
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
        type: 'fixed',
        value: 30000,
        minOrderValue: 300000,
        usageLimit: -1,
        userLimit: 5,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log(`Created ${vouchers.length} vouchers`);

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
