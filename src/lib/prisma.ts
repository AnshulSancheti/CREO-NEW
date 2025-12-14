import { PrismaClient } from '@prisma/client';

// Provide a safe fallback so Prisma doesn't crash when DATABASE_URL isn't set locally.
// We ship a pre-built SQLite DB at prisma/data/creo.db that the course builder can use.
const DEFAULT_DB_URL = 'file:./prisma/data/creo.db';
const databaseUrl = process.env.DATABASE_URL || DEFAULT_DB_URL;

// Ensure Prisma's generated client sees a usable URL even if the env var is missing
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[Prisma] DATABASE_URL not set. Falling back to ${databaseUrl}`);
  }
}

// Singleton pattern for Prisma Client
// Prevents multiple instances in development (hot reload)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
