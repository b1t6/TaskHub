import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signSession, toUser, verifyPassword } from "@/server/auth";
import { HttpError } from "@/server/errors";
import { fail, htmlWithSession, json } from "@/server/http";
import type { LoginInput } from "@/types";

async function readLogin(req: Request): Promise<LoginInput & { form: boolean }> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await req.json()) as LoginInput;
    return { email: body.email, password: body.password, form: false };
  }
  const form = await req.formData();
  return {
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    form: true,
  };
}

export async function POST(req: Request) {
  try {
    const body = await readLogin(req);
    const email = body.email?.trim().toLowerCase();
    const back = () => NextResponse.redirect(new URL("/login?error=1", req.url), 302);

    if (!email || !body.password) {
      if (body.form) return back();
      throw new HttpError(400, "请输入邮箱和密码");
    }
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      if (body.form) return back();
      throw new HttpError(401, "邮箱或密码错误");
    }
    const token = signSession(user.id);
    if (body.form) return htmlWithSession(req, "/dashboard", token);
    return json({ user: toUser(user), token }, 200, { token });
  } catch (error) {
    return fail(error);
  }
}
