import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { createTask, listTasks } from "@/server/services/tasks";
import type { CreateTaskInput, TaskFilters, TaskPriority, TaskStatus } from "@/types";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    const url = new URL(req.url);
    const filters: TaskFilters = {
      keyword: url.searchParams.get("keyword") ?? undefined,
      assigneeId: url.searchParams.get("assigneeId") ?? undefined,
      priority: (url.searchParams.get("priority") as TaskPriority | null) ?? undefined,
      status: (url.searchParams.get("status") as TaskStatus | null) ?? undefined,
      labelId: url.searchParams.get("labelId") ?? undefined,
    };
    return json(await listTasks(await requireUser(), projectId, filters));
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    const body = (await req.json()) as CreateTaskInput;
    return json(await createTask(await requireUser(), { ...body, projectId }));
  });
}
