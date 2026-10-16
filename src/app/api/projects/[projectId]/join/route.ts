import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { joinTeamProject } from "@/server/services/projects";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    return json(await joinTeamProject(await requireUser(), projectId));
  });
}
