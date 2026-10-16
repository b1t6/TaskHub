import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { getProject } from "@/server/services/projects";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    return json(await getProject(await requireUser(), projectId));
  });
}
