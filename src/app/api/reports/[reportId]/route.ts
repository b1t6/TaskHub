import { requireUser } from "@/server/auth";
import { json, noContent, run } from "@/server/http";
import { deleteReport, updateReport } from "@/server/services/reports";
import type { UpdateReportInput } from "@/types";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  return run(async () => {
    const { reportId } = await ctx.params;
    const body = (await req.json()) as UpdateReportInput;
    return json(await updateReport(await requireUser(), reportId, body));
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ reportId: string }> }
) {
  return run(async () => {
    const { reportId } = await ctx.params;
    await deleteReport(await requireUser(), reportId);
    return noContent();
  });
}
