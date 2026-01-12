import prisma from '../lib/prisma';
import { config } from './index';

const connectDB = async (): Promise<void> => {
  // MySQL/Prisma Connection
  try {
    // Try to connect to MySQL/Prisma
    await prisma.$connect();
    console.log('MySQL Connected via Prisma');
  } catch (error) {
    console.error(`MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default connectDB;
