import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const normalizedDatabaseUrl = config.databaseUrl
  .trim()
  .replace(/^"(.*)"$/, '$1')
  .replace(/^'(.*)'$/, '$1');

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: normalizedDatabaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
