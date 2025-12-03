import mongoose from 'mongoose';
import { config } from '../config';
import Category from '../models/Category';

const categories = [
  {
    name: 'Bánh Sinh Nhật',
    description: 'Bánh sinh nhật cao cấp với nhiều mẫu mã sang trọng, phù hợp cho mọi dịp đặc biệt',
    order: 1,
    isActive: true,
  },
  {
    name: 'Bánh Cưới',
    description: 'Bánh cưới sang trọng, tinh tế, được thiết kế riêng cho ngày trọng đại của bạn',
    order: 2,
    isActive: true,
  },
  {
    name: 'Bánh Ngọt',
    description: 'Các loại bánh ngọt Pháp tinh tế, được làm từ nguyên liệu nhập khẩu cao cấp',
    order: 3,
    isActive: true,
  },
  {
    name: 'Bánh Mì',
    description: 'Bánh mì tươi mỗi ngày với hương vị đặc trưng và nguyên liệu chất lượng',
    order: 4,
    isActive: true,
  },
  {
    name: 'Chocolate',
    description: 'Chocolate thủ công cao cấp, được làm từ cacao tuyển chọn',
    order: 5,
    isActive: true,
  },
  {
    name: 'Quà Tặng',
    description: 'Hộp quà tặng được thiết kế sang trọng, phù hợp cho mọi dịp',
    order: 6,
    isActive: true,
  },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Log created categories
    createdCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    console.log('\nCategories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
