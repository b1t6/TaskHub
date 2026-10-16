import { db } from "@/lib/db";
import { signSession, toUser, verifyPassword } from "@/server/auth";
import { HttpError } from "@/server/errors";
import { json, run } from "@/server/http";
import type { LoginInput } from "@/types";

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as LoginInput;
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) throw new HttpError(400, "请输入邮箱和密码");
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      throw new HttpError(401, "邮箱或密码错误");
    }
    const token = signSession(user.id);
    return json({ user: toUser(user), token }, 200, { token });
  });
}
