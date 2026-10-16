import { requireUser } from "@/server/auth";
import { json, noContent, run } from "@/server/http";
import { deleteTask, updateTask } from "@/server/services/tasks";
import type { UpdateTaskInput } from "@/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ taskId: string }> }
) {
  return run(async () => {
    const { taskId } = await ctx.params;
    const body = (await req.json()) as UpdateTaskInput;
    return json(await updateTask(await requireUser(), taskId, body));
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ taskId: string }> }
) {
  return run(async () => {
    const { taskId } = await ctx.params;
    await deleteTask(await requireUser(), taskId);
    return noContent();
  });
}
