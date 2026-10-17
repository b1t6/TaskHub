import { db } from "@/lib/db";
import type { UpdateSettingsInput, User, UserSettings } from "@/types";
import { HttpError } from "../errors";

export async function getSettings(user: User): Promise<UserSettings> {
  const row = await db.userSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  return {
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    notifyDue: row.notifyDue,
    notifyComment: row.notifyComment,
    weekStart: row.weekStart,
    teamName: user.teamName ?? null,
  };
}

export async function updateSettings(
  user: User,
  input: UpdateSettingsInput
): Promise<UserSettings> {
  if (input.username !== undefined) {
    const username = input.username.trim();
    if (username.length < 2) throw new HttpError(400, "用户名至少 2 个字符");
    const taken = await db.user.findFirst({
      where: { username, NOT: { id: user.id } },
    });
    if (taken) throw new HttpError(409, "该用户名已被占用");
    await db.user.update({ where: { id: user.id }, data: { username } });
  }

  if (input.avatarUrl !== undefined) {
    const avatarUrl = input.avatarUrl?.trim() || null;
    if (avatarUrl && !avatarUrl.startsWith("data:image/")) {
      throw new HttpError(400, "头像格式不正确");
    }
    if (avatarUrl && avatarUrl.length > 180_000) {
      throw new HttpError(400, "头像过大，请换一张更小的图片");
    }
    await db.user.update({ where: { id: user.id }, data: { avatarUrl } });
  }

  if (input.weekStart !== undefined && input.weekStart !== 0 && input.weekStart !== 1) {
    throw new HttpError(400, "周起始日仅支持周日(0)或周一(1)");
  }

  await db.userSetting.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      notifyDue: input.notifyDue ?? true,
      notifyComment: input.notifyComment ?? true,
      weekStart: input.weekStart ?? 1,
    },
    update: {
      notifyDue: input.notifyDue,
      notifyComment: input.notifyComment,
      weekStart: input.weekStart,
    },
  });

  const refreshed = await db.user.findUnique({
    where: { id: user.id },
    include: { team: true, setting: true },
  });
  if (!refreshed?.setting) throw new HttpError(500, "设置读取失败");
  return {
    username: refreshed.username,
    email: refreshed.email,
    avatarUrl: refreshed.avatarUrl,
    notifyDue: refreshed.setting.notifyDue,
    notifyComment: refreshed.setting.notifyComment,
    weekStart: refreshed.setting.weekStart,
    teamName: refreshed.team?.name ?? null,
  };
}
