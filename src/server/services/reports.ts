import { db } from "@/lib/db";
import type { CreateReportInput, ReportItem, UpdateReportInput, User } from "@/types";
import { HttpError } from "../errors";

function toReport(
  row: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      email: string;
      username: string;
      avatarUrl: string | null;
      teamId: string | null;
    };
  },
  viewerId: string
): ReportItem {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: {
      id: row.author.id,
      email: row.author.email,
      username: row.author.username,
      avatarUrl: row.author.avatarUrl,
      teamId: row.author.teamId,
    },
    mine: row.author.id === viewerId,
  };
}

export async function listReports(
  user: User,
  scope: "personal" | "team"
): Promise<ReportItem[]> {
  if (scope === "personal") {
    const rows = await db.report.findMany({
      where: { authorId: user.id },
      include: { author: true },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => toReport(row, user.id));
  }

  if (!user.teamId) throw new HttpError(400, "请先加入团队后再查看团队报告");
  const rows = await db.report.findMany({
    where: { author: { teamId: user.teamId } },
    include: { author: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => toReport(row, user.id));
}

export async function createReport(user: User, input: CreateReportInput): Promise<ReportItem> {
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title) throw new HttpError(400, "请填写报告标题");
  if (!content) throw new HttpError(400, "请填写报告内容");
  const row = await db.report.create({
    data: { authorId: user.id, title, content },
    include: { author: true },
  });
  return toReport(row, user.id);
}

export async function updateReport(
  user: User,
  reportId: string,
  input: UpdateReportInput
): Promise<ReportItem> {
  const existing = await db.report.findUnique({
    where: { id: reportId },
    include: { author: true },
  });
  if (!existing) throw new HttpError(404, "报告不存在");
  if (existing.authorId !== user.id) throw new HttpError(403, "只能修改自己的报告");
  const title = input.title !== undefined ? input.title.trim() : undefined;
  const content = input.content !== undefined ? input.content.trim() : undefined;
  if (title !== undefined && !title) throw new HttpError(400, "报告标题不能为空");
  if (content !== undefined && !content) throw new HttpError(400, "报告内容不能为空");
  const row = await db.report.update({
    where: { id: reportId },
    data: { title, content },
    include: { author: true },
  });
  return toReport(row, user.id);
}

export async function deleteReport(user: User, reportId: string): Promise<void> {
  const existing = await db.report.findUnique({ where: { id: reportId } });
  if (!existing) throw new HttpError(404, "报告不存在");
  if (existing.authorId !== user.id) throw new HttpError(403, "只能删除自己的报告");
  await db.report.delete({ where: { id: reportId } });
}
