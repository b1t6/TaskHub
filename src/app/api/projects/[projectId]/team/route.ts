import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { assignProjectTeam } from "@/server/services/projects";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    const body = (await req.json()) as { teamId?: string | null };
    return json(
      await assignProjectTeam(await requireUser(), projectId, body.teamId ?? null)
    );
  });
}
