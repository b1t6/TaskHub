import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { CreateTeamInput, JoinTeamInput, TeamInfo, User } from "@/types";
import { HttpError } from "../errors";

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(3).toString("hex").toUpperCase();
    const exists = await db.team.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new HttpError(500, "团队邀请码生成失败，请重试");
}

function toTeamInfo(
  team: {
    id: string;
    name: string;
    code: string;
    ownerId: string;
    members: {
      id: string;
      username: string;
      email: string;
      avatarUrl: string | null;
    }[];
  }
): TeamInfo {
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    ownerId: team.ownerId,
    members: team.members.map((m) => ({
      id: m.id,
      username: m.username,
      email: m.email,
      avatarUrl: m.avatarUrl,
      isOwner: m.id === team.ownerId,
    })),
  };
}

export async function getMyTeam(user: User): Promise<TeamInfo | null> {
  if (!user.teamId) return null;
  const team = await db.team.findUnique({
    where: { id: user.teamId },
    include: {
      members: {
        select: { id: true, username: true, email: true, avatarUrl: true },
        orderBy: { username: "asc" },
      },
    },
  });
  return team ? toTeamInfo(team) : null;
}

export async function createTeam(user: User, input: CreateTeamInput): Promise<TeamInfo> {
  if (user.teamId) throw new HttpError(400, "你已加入团队，请先退出当前团队");
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, "请填写团队名称");
  const code = await uniqueCode();
  const team = await db.team.create({
    data: {
      name,
      code,
      ownerId: user.id,
      members: { connect: { id: user.id } },
    },
    include: {
      members: {
        select: { id: true, username: true, email: true, avatarUrl: true },
      },
    },
  });
  return toTeamInfo(team);
}

export async function joinTeam(user: User, input: JoinTeamInput): Promise<TeamInfo> {
  if (user.teamId) throw new HttpError(400, "你已加入团队，请先退出当前团队");
  const code = input.code?.trim().toUpperCase();
  if (!code) throw new HttpError(400, "请输入团队邀请码");
  const team = await db.team.findUnique({
    where: { code },
    include: {
      members: {
        select: { id: true, username: true, email: true, avatarUrl: true },
      },
    },
  });
  if (!team) throw new HttpError(404, "团队邀请码无效");
  await db.user.update({ where: { id: user.id }, data: { teamId: team.id } });
  const refreshed = await db.team.findUnique({
    where: { id: team.id },
    include: {
      members: {
        select: { id: true, username: true, email: true, avatarUrl: true },
        orderBy: { username: "asc" },
      },
    },
  });
  return toTeamInfo(refreshed!);
}

export async function leaveTeam(user: User): Promise<void> {
  if (!user.teamId) throw new HttpError(400, "你当前不在任何团队中");
  const team = await db.team.findUnique({
    where: { id: user.teamId },
    include: { _count: { select: { members: true } } },
  });
  if (!team) {
    await db.user.update({ where: { id: user.id }, data: { teamId: null } });
    return;
  }
  if (team.ownerId === user.id && team._count.members > 1) {
    throw new HttpError(400, "团队所有者需先转让团队或清空其他成员后再退出");
  }
  await db.user.update({ where: { id: user.id }, data: { teamId: null } });
  if (team.ownerId === user.id) {
    await db.project.updateMany({ where: { teamId: team.id }, data: { teamId: null } });
    await db.team.delete({ where: { id: team.id } });
  }
}
