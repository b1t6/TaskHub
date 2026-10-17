import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { HttpError } from "./errors";

const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

function isHttps(req?: Request): boolean {
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol;
    if (proto.includes("https")) return true;
    if (proto.includes("http:")) return false;
  }
  return process.env.NODE_ENV === "production";
}

function sessionCookie(value: string, maxAge: number, secure: boolean): string {
  const parts = [
    `session=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function applySession(res: NextResponse, token: string | null, req?: Request) {
  const value = token ?? "";
  const maxAge = token ? SESSION_MAX_AGE : 0;
  const secure = isHttps(req);
  res.cookies.set("session", value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure,
  });
  // EdgeOne 会丢弃 cookies API，必须再写一份标准 Set-Cookie
  res.headers.append("Set-Cookie", sessionCookie(value, maxAge, secure));
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/**
 * EdgeOne 会丢掉云函数响应里的 Set-Cookie，且 x-forwarded-host 可能是内部截图域名。
 * 只在当前站点用相对路径跳转，并把会话附在本次请求上。
 */
export function htmlWithSession(_req: Request, path: string, token: string) {
  const secure = process.env.NODE_ENV === "production";
  const cookie =
    `session=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax` +
    (secure ? "; Secure" : "");
  const target = `${path}?session=${encodeURIComponent(token)}`;
  const html = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>登录成功</title></head>
<body>
<p>登录成功，正在进入…</p>
<script>
document.cookie = ${JSON.stringify(cookie)};
location.replace(${JSON.stringify(target)});
</script>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export function json<T>(data: T, status = 200, init?: { token?: string; clearSession?: boolean }) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "private, no-store");
  if (init?.token) return applySession(res, init.token);
  if (init?.clearSession) return applySession(res, null);
  return res;
}

export function clearSession(res: NextResponse, req?: Request) {
  return applySession(res, null, req);
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
