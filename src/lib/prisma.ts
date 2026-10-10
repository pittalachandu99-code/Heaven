import { PrismaClient } from '@prisma/client';
import path from 'path';

// Robust SQLite path resolution across local and cloud environments (Render, Linux, Windows)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')) {
  const rawPath = process.env.DATABASE_URL.replace('file:', '');
  if (!path.isAbsolute(rawPath)) {
    const cleanPath = rawPath.replace(/^\.\//, '').replace(/^prisma[\/\\]/, '');
    const absoluteDbPath = path.resolve(process.cwd(), 'prisma', cleanPath);
    process.env.DATABASE_URL = `file:${absoluteDbPath}`;
  }
} else if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
