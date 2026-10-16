import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { createReport, listReports } from "@/server/services/reports";
import type { CreateReportInput } from "@/types";

export async function GET(req: Request) {
  return run(async () => {
    const scope = new URL(req.url).searchParams.get("scope") === "team" ? "team" : "personal";
    return json(await listReports(await requireUser(), scope));
  });
}

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as CreateReportInput;
    return json(await createReport(await requireUser(), body));
  });
}
