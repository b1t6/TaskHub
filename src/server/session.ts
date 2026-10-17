import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import type { User } from "@/types";

/** 页面级登录校验：未登录直接跳转登录页 */
export async function requirePageUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
