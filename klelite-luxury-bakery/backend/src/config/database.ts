import prisma from '../lib/prisma';

const connectDB = async (): Promise<void> => {
  const MAX_RETRIES = 5;
  const BASE_RETRY_INTERVAL = 5000;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await prisma.$connect();
      console.log('MySQL Connected via Prisma');
      return;
    } catch (error) {
      retries++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`MySQL connection failed (${retries}/${MAX_RETRIES}): ${errorMessage}`);

      if (retries === MAX_RETRIES) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }

      const backoffDelay = Math.min(BASE_RETRY_INTERVAL * Math.pow(2, retries - 1), 30000);
      console.log(`Retrying in ${backoffDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
};

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default connectDB;
