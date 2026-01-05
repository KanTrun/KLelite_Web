import mongoose from 'mongoose';
import prisma from '../lib/prisma';
import { config } from './index';

const connectDB = async (): Promise<void> => {
  // MySQL/Prisma Connection
  const MAX_RETRIES = 5;
  const BASE_RETRY_INTERVAL = 5000;
  let retries = 0;

  try {
    // Try to connect to MySQL/Prisma
    await prisma.$connect();
    console.log('MySQL Connected via Prisma');
  } catch (error) {
    console.error(`MySQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // We don't exit process here as we want to try MongoDB connection too
  }

  // MongoDB Connection (Restored)
  try {
    const mongoOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(config.mongodbUri, mongoOptions);
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Only exit if both databases fail? Or just warn?
    // For now, consistent with original behavior, we might want to log loudly
    console.warn('MongoDB connection failed. Mongoose models will not work.');
  }
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await mongoose.disconnect();
});

export default connectDB;
