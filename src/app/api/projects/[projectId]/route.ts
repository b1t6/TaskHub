import { requireUser } from "@/server/auth";
import { json, noContent, run } from "@/server/http";
import { deleteProject, getProject } from "@/server/services/projects";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    return json(await getProject(await requireUser(), projectId));
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    await deleteProject(await requireUser(), projectId);
    return noContent();
  });
}
