import type { ProjectStatus } from "@prisma/client";
import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { updateProjectStatus } from "@/server/services/projects";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    const body = (await req.json()) as { status: ProjectStatus };
    return json(await updateProjectStatus(await requireUser(), projectId, body.status));
  });
}
