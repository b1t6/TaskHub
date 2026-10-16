import type { MemberRole } from "@prisma/client";
import { requireUser } from "@/server/auth";
import { noContent, run } from "@/server/http";
import { removeMember, updateMemberRole } from "@/server/services/projects";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string; userId: string }> }
) {
  return run(async () => {
    const { projectId, userId } = await ctx.params;
    const body = (await req.json()) as { role: MemberRole };
    await updateMemberRole(await requireUser(), projectId, userId, body.role);
    return noContent();
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ projectId: string; userId: string }> }
) {
  return run(async () => {
    const { projectId, userId } = await ctx.params;
    await removeMember(await requireUser(), projectId, userId);
    return noContent();
  });
}
