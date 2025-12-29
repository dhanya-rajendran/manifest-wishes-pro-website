import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
    // Supply connection URL via constructor to align with current Prisma config
    datasources: { db: { url: process.env.DATABASE_URL } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma