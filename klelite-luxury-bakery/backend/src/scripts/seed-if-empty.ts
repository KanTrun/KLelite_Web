import prisma from '../lib/prisma';
import { seedAll } from './seed';

const seedIfEmpty = async () => {
  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      console.log(`Database already has ${userCount} user(s); skipping seed.`);
      return;
    }

    console.log('No users detected. Running initial seed...');
    await seedAll();
    console.log('Seed completed because database was empty.');
  } catch (error) {
    console.error('Failed to evaluate seed requirement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  seedIfEmpty()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedIfEmpty };
