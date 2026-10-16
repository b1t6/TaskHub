import { PrismaClient } from "@prisma/client";

// 开发环境热重载时复用同一 PrismaClient 实例，避免连接数耗尽
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
