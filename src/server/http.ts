import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { HttpError } from "./errors";

export function json<T>(data: T, status = 200, init?: { token?: string; clearSession?: boolean }) {
  const res = NextResponse.json(data, { status });
  if (init?.token) {
    res.cookies.set("session", init.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });
  }
  if (init?.clearSession) {
    res.cookies.set("session", "", { httpOnly: true, path: "/", maxAge: 0 });
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
