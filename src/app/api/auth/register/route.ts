import { db } from "@/lib/db";
import { hashPassword, signSession, toUser } from "@/server/auth";
import { HttpError } from "@/server/errors";
import { json, run } from "@/server/http";
import type { RegisterInput } from "@/types";

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as RegisterInput;
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const password = body.password ?? "";
    if (!email || !email.includes("@")) throw new HttpError(400, "邮箱格式不正确");
    if (!username || username.length < 2) throw new HttpError(400, "用户名至少 2 个字符");
    if (password.length < 6) throw new HttpError(400, "密码至少 6 位");

    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists?.email === email) throw new HttpError(409, "该邮箱已被注册");
    if (exists) throw new HttpError(409, "该用户名已被占用");

    const user = await db.user.create({
      data: { email, username, passwordHash: hashPassword(password) },
    });
    const token = signSession(user.id);
    return json({ user: toUser(user), token }, 200, { token });
  });
}
