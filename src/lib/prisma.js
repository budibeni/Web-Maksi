import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Force clear cache for hot-reload
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  // Disconnect old client if possible, though not strictly required
  // globalForPrisma.prisma.$disconnect();
  delete globalForPrisma.prisma;
}

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
