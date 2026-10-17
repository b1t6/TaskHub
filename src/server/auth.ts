import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import type { User } from "@/types";
import { HttpError } from "./errors";

const COOKIE = "session";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new HttpError(500, "服务未配置 AUTH_SECRET");
  return value;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function signSession(userId: string): string {
  const body = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + MAX_AGE_MS })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      sub?: string;
      exp?: number;
    };
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

const userSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  teamId: true,
  team: { select: { name: true } },
} as const;

export function toUser(user: {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  teamId?: string | null;
  team?: { name: string } | null;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    teamId: user.teamId ?? null,
    teamName: user.team?.name ?? null,
  };
}

function tokenFromHeader(raw: string | null): string | undefined {
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export async function currentUser(): Promise<User | null> {
  const token =
    (await cookies()).get(COOKIE)?.value ?? tokenFromHeader((await headers()).get("cookie"));
  const userId = readSession(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: userSelect });
  return user ? toUser(user) : null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "未登录，请先登录");
  return user;
}
