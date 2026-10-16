import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { joinProject } from "@/server/services/projects";
import type { JoinProjectInput } from "@/types";

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as JoinProjectInput;
    return json(await joinProject(await requireUser(), body.inviteCode ?? ""));
  });
}
