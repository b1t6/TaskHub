import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signSession, toUser } from "@/server/auth";
import { HttpError } from "@/server/errors";
import { fail, json, redirectWithSession } from "@/server/http";
import type { RegisterInput } from "@/types";

async function readRegister(req: Request): Promise<RegisterInput & { form: boolean }> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await req.json()) as RegisterInput;
    return { ...body, form: false };
  }
  const form = await req.formData();
  return {
    email: String(form.get("email") ?? ""),
    username: String(form.get("username") ?? ""),
    password: String(form.get("password") ?? ""),
    form: true,
  };
}

export async function POST(req: Request) {
  try {
    const body = await readRegister(req);
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const password = body.password ?? "";
    const back = (message: string) =>
      NextResponse.redirect(new URL(`/register?error=${encodeURIComponent(message)}`, req.url), 302);

    if (!email || !email.includes("@")) {
      if (body.form) return back("邮箱格式不正确");
      throw new HttpError(400, "邮箱格式不正确");
    }
    if (!username || username.length < 2) {
      if (body.form) return back("用户名至少 2 个字符");
      throw new HttpError(400, "用户名至少 2 个字符");
    }
    if (password.length < 6) {
      if (body.form) return back("密码至少 6 位");
      throw new HttpError(400, "密码至少 6 位");
    }

    const exists = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists?.email === email) {
      if (body.form) return back("该邮箱已被注册");
      throw new HttpError(409, "该邮箱已被注册");
    }
    if (exists) {
      if (body.form) return back("该用户名已被占用");
      throw new HttpError(409, "该用户名已被占用");
    }

    const user = await db.user.create({
      data: { email, username, passwordHash: hashPassword(password) },
    });
    const token = signSession(user.id);
    if (body.form) return redirectWithSession(req, "/dashboard", token);
    return json({ user: toUser(user), token }, 200, { token });
  } catch (error) {
    return fail(error);
  }
}
