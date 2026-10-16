import { randomBytes } from "crypto";
import type { MemberRole, ProjectStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  CreateProjectInput,
  Member,
  Project,
  ProjectDetail,
  TeamProjectCard,
  User,
} from "@/types";
import { HttpError } from "../errors";

const STATUS_LABEL = {
  TODO: "待办",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
} as const;

export async function taskStats(projectId: string) {
  const tasks = await db.task.findMany({
    where: { projectId },
    select: { status: true, dueDate: true },
  });
  const now = new Date();
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
    overdue: tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate !== null && t.dueDate < now
    ).length,
  };
}

async function inviteCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    const exists = await db.project.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new HttpError(500, "邀请码生成失败，请重试");
}

export async function membership(projectId: string, userId: string) {
  return db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
}

export async function requireMember(projectId: string, user: User) {
  const member = await membership(projectId, user.id);
  if (!member) throw new HttpError(403, "无权访问该项目");
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new HttpError(404, "项目不存在");
  return { project, role: member.role };
}

async function toProject(
  project: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    inviteCode: string;
    status: ProjectStatus;
    teamId: string | null;
    createdAt: Date;
  },
  userId: string
): Promise<Project> {
  const [role, memberCount, stats, team] = await Promise.all([
    membership(project.id, userId),
    db.projectMember.count({ where: { projectId: project.id } }),
    taskStats(project.id),
    project.teamId
      ? db.team.findUnique({ where: { id: project.teamId }, select: { name: true } })
      : Promise.resolve(null),
  ]);
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    teamId: project.teamId,
    teamName: team?.name ?? null,
    inviteCode: project.inviteCode,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    myRole: role?.role ?? "MEMBER",
    memberCount,
    taskStats: stats,
  };
}

export async function listProjects(user: User): Promise<Project[]> {
  const rows = await db.project.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(rows.map((row) => toProject(row, user.id)));
}

/** 项目组：登录用户可查看所有已归属团队的项目与进度，不要求自己已加入团队 */
export async function listTeamProjects(user: User): Promise<TeamProjectCard[]> {
  const rows = await db.project.findMany({
    where: { teamId: { not: null } },
    include: {
      team: { select: { id: true, name: true } },
      owner: {
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          teamId: true,
        },
      },
      members: { where: { userId: user.id }, select: { id: true } },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return Promise.all(
    rows.map(async (row) => {
      const joined = row.members.length > 0;
      const teamId = row.teamId as string;
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        teamId,
        teamName: row.team?.name ?? "未命名团队",
        owner: {
          id: row.owner.id,
          email: row.owner.email,
          username: row.owner.username,
          avatarUrl: row.owner.avatarUrl,
          teamId: row.owner.teamId,
        },
        memberCount: row._count.members,
        taskStats: await taskStats(row.id),
        joined,
        canJoin: !joined && Boolean(user.teamId) && user.teamId === teamId,
      };
    })
  );
}

export async function createProject(user: User, input: CreateProjectInput): Promise<Project> {
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, "请填写项目名称");
  const code = await inviteCode();
  const project = await db.project.create({
    data: {
      name,
      description: input.description?.trim() || null,
      ownerId: user.id,
      inviteCode: code,
      status: "ACTIVE",
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await db.activityLog.create({
    data: {
      projectId: project.id,
      userId: user.id,
      type: "PROJECT_CREATED",
      content: `创建了项目「${project.name}」`,
    },
  });
  return toProject(project, user.id);
}

export async function getProject(user: User, projectId: string): Promise<ProjectDetail> {
  await requireMember(projectId, user);
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      labels: { orderBy: { name: "asc" } },
    },
  });
  if (!project) throw new HttpError(404, "项目不存在");
  const base = await toProject(project, user.id);
  const members: Member[] = project.members.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    username: m.user.username,
    avatarUrl: m.user.avatarUrl,
    teamId: m.user.teamId,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
  }));
  return {
    ...base,
    members,
    labels: project.labels.map((l) => ({
      id: l.id,
      projectId: l.projectId,
      name: l.name,
      color: l.color,
    })),
  };
}

export async function joinProject(user: User, inviteCodeInput: string): Promise<Project> {
  const code = inviteCodeInput.trim().toUpperCase();
  if (!code) throw new HttpError(400, "请输入邀请码");
  const project = await db.project.findFirst({
    where: { inviteCode: code },
  });
  if (!project) throw new HttpError(404, "邀请码无效");
  if (project.teamId && project.teamId !== user.teamId) {
    throw new HttpError(403, "该项目已归属团队，只有同团队成员可以加入协作");
  }
  const existing = await membership(project.id, user.id);
  if (!existing) {
    await db.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "MEMBER" },
    });
    await db.activityLog.create({
      data: {
        projectId: project.id,
        userId: user.id,
        type: "MEMBER_JOINED",
        content: `加入了项目「${project.name}」`,
      },
    });
  }
  const refreshed = await db.project.findUniqueOrThrow({ where: { id: project.id } });
  return toProject(refreshed, user.id);
}

/** 从项目组加入：同团队成员可加入他人项目 */
export async function joinTeamProject(user: User, projectId: string): Promise<Project> {
  if (!user.teamId) throw new HttpError(400, "请先加入团队");
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new HttpError(404, "项目不存在");
  if (project.teamId !== user.teamId) throw new HttpError(403, "只能加入同一团队的项目");
  const existing = await membership(project.id, user.id);
  if (!existing) {
    await db.projectMember.create({
      data: { projectId: project.id, userId: user.id, role: "MEMBER" },
    });
    await db.activityLog.create({
      data: {
        projectId: project.id,
        userId: user.id,
        type: "MEMBER_JOINED",
        content: `加入了项目「${project.name}」`,
      },
    });
  }
  return toProject(project, user.id);
}

/** 仅项目所有者可以把项目归属到自己所在团队，或取消归属 */
export async function assignProjectTeam(
  user: User,
  projectId: string,
  teamId: string | null
): Promise<Project> {
  const { role, project } = await requireMember(projectId, user);
  if (role !== "OWNER") throw new HttpError(403, "只有项目所有者可以决定项目归属");
  if (teamId) {
    if (!user.teamId || user.teamId !== teamId) {
      throw new HttpError(403, "只能把项目归属到你当前所在的团队");
    }
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) throw new HttpError(404, "团队不存在");
  }
  const updated = await db.project.update({
    where: { id: project.id },
    data: { teamId },
  });
  await db.activityLog.create({
    data: {
      projectId: project.id,
      userId: user.id,
      type: "TEAM_ASSIGNED",
      content: teamId ? "将项目归属到了所在团队" : "取消了项目的团队归属",
    },
  });
  return toProject(updated, user.id);
}

export async function updateProjectStatus(
  user: User,
  projectId: string,
  status: ProjectStatus
): Promise<Project> {
  const { role, project } = await requireMember(projectId, user);
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new HttpError(403, "仅所有者或管理员可修改项目状态");
  }
  if (!["ACTIVE", "PAUSED", "COMPLETED"].includes(status)) {
    throw new HttpError(400, "项目状态不合法");
  }
  const updated = await db.project.update({
    where: { id: project.id },
    data: { status },
  });
  return toProject(updated, user.id);
}

export async function listMembers(user: User, projectId: string): Promise<Member[]> {
  const detail = await getProject(user, projectId);
  return detail.members;
}

export async function updateMemberRole(
  user: User,
  projectId: string,
  userId: string,
  role: MemberRole
) {
  const { role: myRole } = await requireMember(projectId, user);
  if (myRole !== "OWNER") throw new HttpError(403, "仅项目所有者可以修改成员角色");
  if (role !== "ADMIN" && role !== "MEMBER") throw new HttpError(400, "角色不合法");
  const target = await membership(projectId, userId);
  if (!target) throw new HttpError(404, "成员不存在");
  if (target.role === "OWNER") throw new HttpError(400, "不能修改所有者角色");
  await db.projectMember.update({ where: { id: target.id }, data: { role } });
}

export async function removeMember(user: User, projectId: string, userId: string) {
  const { role: myRole } = await requireMember(projectId, user);
  if (myRole !== "OWNER" && myRole !== "ADMIN") throw new HttpError(403, "无权移除成员");
  const target = await membership(projectId, userId);
  if (!target) throw new HttpError(404, "成员不存在");
  if (target.role === "OWNER") throw new HttpError(400, "不能移除项目所有者");
  await db.projectMember.delete({ where: { id: target.id } });
}

export async function listActivities(user: User, projectId: string) {
  await requireMember(projectId, user);
  const rows = await db.activityLog.findMany({
    where: { projectId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId,
    type: row.type,
    content: row.content,
    user: {
      id: row.user.id,
      email: row.user.email,
      username: row.user.username,
      avatarUrl: row.user.avatarUrl,
      teamId: row.user.teamId,
    },
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createLabel(
  user: User,
  input: { projectId: string; name: string; color: string }
) {
  await requireMember(input.projectId, user);
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, "请填写标签名称");
  const label = await db.label.create({
    data: {
      projectId: input.projectId,
      name,
      color: input.color?.trim() || "#1677ff",
    },
  });
  return {
    id: label.id,
    projectId: label.projectId,
    name: label.name,
    color: label.color,
  };
}

export { STATUS_LABEL };
