import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { listTeamProjects } from "@/server/services/projects";

export async function GET() {
  return run(async () => json(await listTeamProjects(await requireUser())));
}
