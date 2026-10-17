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

export function json<T>(data: T, status = 200, init?: { token?: string; clearSession?: boolean }) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  if (init?.token) {
    // 同时写标准 Set-Cookie。EdgeOne 会丢掉 NextResponse.cookies，只保留响应头。
    res.headers.append("Set-Cookie", sessionCookie(init.token, SESSION_MAX_AGE));
  }
  if (init?.clearSession) {
    res.headers.append("Set-Cookie", sessionCookie("", 0));
  }
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
