import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { HttpError } from "./errors";

const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

function sessionCookie(value: string, maxAge: number): string {
  return [
    `session=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    "Secure",
  ].join("; ");
}

function applySession(res: NextResponse, token: string | null) {
  const value = token ?? "";
  const maxAge = token ? SESSION_MAX_AGE : 0;
  res.cookies.set("session", value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: true,
  });
  res.headers.append("Set-Cookie", sessionCookie(value, maxAge));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export function redirectWithSession(req: Request, path: string, token: string) {
  const res = NextResponse.redirect(new URL(path, req.url), 302);
  return applySession(res, token);
}

export function json<T>(data: T, status = 200, init?: { token?: string; clearSession?: boolean }) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "private, no-store");
  if (init?.token) return applySession(res, init.token);
  if (init?.clearSession) return applySession(res, null);
  return res;
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ message: "数据已存在，请检查邮箱、用户名或标签名" }, { status: 409 });
  }
  console.error(error);
  return NextResponse.json({ message: "服务器内部错误" }, { status: 500 });
}

export async function run(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error) {
    return fail(error);
  }
}
