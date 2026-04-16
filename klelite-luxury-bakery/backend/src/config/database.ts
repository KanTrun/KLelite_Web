import prisma from '../lib/prisma';
import { config } from './index';

const connectDB = async (): Promise<void> => {
  // MySQL/Prisma Connection
  try {
    const dbUrl = new URL(config.databaseUrl.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'));
    console.log(`Connecting MySQL via ${dbUrl.hostname}:${dbUrl.port || '3306'}/${dbUrl.pathname.replace('/', '')}`);

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
