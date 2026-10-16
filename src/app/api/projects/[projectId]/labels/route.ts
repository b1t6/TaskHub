import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { createLabel } from "@/server/services/projects";
import type { CreateLabelInput } from "@/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> }
) {
  return run(async () => {
    const { projectId } = await ctx.params;
    const body = (await req.json()) as CreateLabelInput;
    return json(await createLabel(await requireUser(), { ...body, projectId }));
  });
}
