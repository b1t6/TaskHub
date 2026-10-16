import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { addComment, listComments } from "@/server/services/tasks";
import type { CreateCommentInput } from "@/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ taskId: string }> }
) {
  return run(async () => {
    const { taskId } = await ctx.params;
    return json(await listComments(await requireUser(), taskId));
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ taskId: string }> }
) {
  return run(async () => {
    const { taskId } = await ctx.params;
    const body = (await req.json()) as CreateCommentInput;
    return json(await addComment(await requireUser(), { ...body, taskId }));
  });
}
