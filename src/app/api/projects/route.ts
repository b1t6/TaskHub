import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";
import type { CreateProjectInput } from "@/types";

export async function GET() {
  return run(async () => json(await listProjects(await requireUser())));
}

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as CreateProjectInput;
    return json(await createProject(await requireUser(), body));
  });
}
