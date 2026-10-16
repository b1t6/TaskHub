import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  Comment,
  CreateCommentInput,
  CreateTaskInput,
  Task,
  TaskFilters,
  UpdateTaskInput,
  User,
} from "@/types";
import { isAdjacentStatus, statusTransitionMessage } from "@/lib/task-status";
import { HttpError } from "../errors";
import { requireMember, STATUS_LABEL } from "./projects";

const taskInclude = {
  assignee: true,
  creator: true,
  labels: { include: { label: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

function toPublicUser(user: {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    assignee: row.assignee ? toPublicUser(row.assignee) : null,
    creator: toPublicUser(row.creator),
    labels: row.labels.map((item) => ({
      id: item.label.id,
      projectId: item.label.projectId,
      name: item.label.name,
      color: item.label.color,
    })),
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    commentCount: row._count.comments,
  };
}

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function asStatus(value: string | undefined): TaskStatus | undefined {
  if (!value) return undefined;
  if (!STATUSES.includes(value as TaskStatus)) throw new HttpError(400, "任务状态不合法");
  return value as TaskStatus;
}

function asPriority(value: string | undefined): TaskPriority | undefined {
  if (!value) return undefined;
  if (!PRIORITIES.includes(value as TaskPriority)) throw new HttpError(400, "优先级不合法");
  return value as TaskPriority;
}

function parseDue(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(400, "截止日期格式不正确");
  return date;
}

async function nextPosition(projectId: string, status: TaskStatus, excludeId?: string) {
  const agg = await db.task.aggregate({
    where: { projectId, status, ...(excludeId ? { id: { not: excludeId } } : {}) },
    _max: { position: true },
  });
  return (agg._max.position ?? 0) + 1000;
}

async function assertAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  if (!member) throw new HttpError(400, "负责人不是该项目成员");
}

async function assertLabels(projectId: string, labelIds: string[] | undefined) {
  if (!labelIds?.length) return;
  const count = await db.label.count({
    where: { projectId, id: { in: labelIds } },
  });
  if (count !== labelIds.length) throw new HttpError(400, "包含不属于该项目的标签");
}

async function loadTask(taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, include: taskInclude });
  if (!task) throw new HttpError(404, "任务不存在");
  return task;
}

export async function listTasks(user: User, projectId: string, filters: TaskFilters = {}) {
  await requireMember(projectId, user);
  const status = asStatus(filters.status);
  const priority = asPriority(filters.priority);
  const rows = await db.task.findMany({
    where: {
      projectId,
      status,
      priority,
      assigneeId: filters.assigneeId || undefined,
      title: filters.keyword ? { contains: filters.keyword } : undefined,
      labels: filters.labelId ? { some: { labelId: filters.labelId } } : undefined,
    },
    include: taskInclude,
    orderBy: { position: "asc" },
  });
  return rows.map(toTask);
}

export async function createTask(user: User, input: CreateTaskInput) {
  await requireMember(input.projectId, user);
  const title = input.title?.trim();
  if (!title) throw new HttpError(400, "请填写任务标题");
  const requested = asStatus(input.status) ?? "TODO";
  if (requested !== "TODO") {
    throw new HttpError(400, "新建任务只能从「待办」开始，请按 待办 → 进行中 → 已完成 依次流转");
  }
  const status: TaskStatus = "TODO";
  const priority = asPriority(input.priority) ?? "MEDIUM";
  await assertAssignee(input.projectId, input.assigneeId);
  await assertLabels(input.projectId, input.labelIds);
  const position = await nextPosition(input.projectId, status);
  const task = await db.task.create({
    data: {
      projectId: input.projectId,
      title,
      description: input.description?.trim() || null,
      status,
      priority,
      dueDate: parseDue(input.dueDate) ?? null,
      assigneeId: input.assigneeId || null,
      creatorId: user.id,
      position,
      labels: input.labelIds?.length
        ? { create: input.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: taskInclude,
  });
  await db.activityLog.create({
    data: {
      projectId: input.projectId,
      taskId: task.id,
      userId: user.id,
      type: "TASK_CREATED",
      content: `创建了任务「${task.title}」`,
    },
  });
  return toTask(task);
}

export async function updateTask(user: User, taskId: string, patch: UpdateTaskInput) {
  const existing = await loadTask(taskId);
  await requireMember(existing.projectId, user);
  if (patch.title !== undefined && !patch.title.trim()) {
    throw new HttpError(400, "任务标题不能为空");
  }
  const status = patch.status !== undefined ? asStatus(patch.status) : undefined;
  const priority = patch.priority !== undefined ? asPriority(patch.priority) : undefined;
  if (patch.assigneeId !== undefined) await assertAssignee(existing.projectId, patch.assigneeId);
  if (patch.labelIds !== undefined) await assertLabels(existing.projectId, patch.labelIds);

  if (status && status !== existing.status && !isAdjacentStatus(existing.status, status)) {
    throw new HttpError(400, statusTransitionMessage(existing.status, status));
  }

  const statusChanged = Boolean(status && status !== existing.status);
  const nextAssigneeId =
    patch.assigneeId !== undefined ? patch.assigneeId || null : existing.assigneeId;
  const assigneeChanged = nextAssigneeId !== existing.assigneeId;
  let position = patch.position;
  if (statusChanged && position === undefined && status) {
    position = await nextPosition(existing.projectId, status, existing.id);
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      title: patch.title !== undefined ? patch.title.trim() : undefined,
      description: patch.description !== undefined ? patch.description : undefined,
      status,
      priority,
      dueDate: parseDue(patch.dueDate),
      assigneeId: patch.assigneeId !== undefined ? patch.assigneeId || null : undefined,
      position,
      labels:
        patch.labelIds !== undefined
          ? {
              deleteMany: {},
              create: patch.labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
    },
    include: taskInclude,
  });

  const assigneeName = task.assignee?.username;
  const content = statusChanged
    ? `将「${task.title}」移入「${STATUS_LABEL[task.status]}」`
    : assigneeChanged
      ? assigneeName
        ? `修改任务「${task.title}」负责人为${assigneeName}`
        : `取消了任务「${task.title}」的负责人`
      : `更新了任务「${task.title}」`;

  await db.activityLog.create({
    data: {
      projectId: task.projectId,
      taskId: task.id,
      userId: user.id,
      type: statusChanged ? "STATUS_CHANGED" : assigneeChanged ? "ASSIGNEE_CHANGED" : "TASK_UPDATED",
      content,
    },
  });
  return toTask(task);
}

export async function deleteTask(user: User, taskId: string) {
  const task = await loadTask(taskId);
  await requireMember(task.projectId, user);
  await db.task.delete({ where: { id: taskId } });
  await db.activityLog.create({
    data: {
      projectId: task.projectId,
      userId: user.id,
      type: "TASK_DELETED",
      content: `删除了任务「${task.title}」`,
    },
  });
}

export async function listComments(user: User, taskId: string): Promise<Comment[]> {
  const task = await loadTask(taskId);
  await requireMember(task.projectId, user);
  const rows = await db.comment.findMany({
    where: { taskId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    content: row.content,
    author: toPublicUser(row.author),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addComment(user: User, input: CreateCommentInput): Promise<Comment> {
  const content = input.content?.trim();
  if (!content) throw new HttpError(400, "评论内容不能为空");
  const task = await loadTask(input.taskId);
  await requireMember(task.projectId, user);
  const comment = await db.comment.create({
    data: { taskId: task.id, authorId: user.id, content },
    include: { author: true },
  });
  await db.activityLog.create({
    data: {
      projectId: task.projectId,
      taskId: task.id,
      userId: user.id,
      type: "COMMENT_ADDED",
      content: `评论了「${task.title}」`,
    },
  });
  return {
    id: comment.id,
    taskId: comment.taskId,
    content: comment.content,
    author: toPublicUser(comment.author),
    createdAt: comment.createdAt.toISOString(),
  };
}
