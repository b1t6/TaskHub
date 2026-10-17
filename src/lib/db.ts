import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { PrismaClient } from "@prisma/client";

function isTidbDatabaseUrl(url: string): boolean {
  if (process.env.TIDB_ADAPTER === "0") return false;
  if (process.env.TIDB_ADAPTER === "1") return true;
  try {
    const parsed = new URL(url);
    if (/tidbcloud\.com$/i.test(parsed.hostname)) return true;
    if (parsed.port === "4000") return true;
  } catch {
    // ignore invalid URL
  }
  return false;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "";
  const log: Array<"warn" | "error"> = ["warn", "error"];

  // TiDB Cloud / Vercel：走 HTTPS Serverless Driver，避免连接数打满
  if (url && isTidbDatabaseUrl(url)) {
    const adapter = new PrismaTiDBCloud({ url });
    return new PrismaClient({ adapter, log });
  }

  // 本地 MySQL 等传统 TCP 连接
  return new PrismaClient({ log });
}

// 开发环境热重载时复用同一 PrismaClient 实例，避免连接数耗尽
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
