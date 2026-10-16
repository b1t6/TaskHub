import { requireUser } from "@/server/auth";
import { json, noContent, run } from "@/server/http";
import { createTeam, getMyTeam, leaveTeam } from "@/server/services/teams";
import type { CreateTeamInput } from "@/types";

export async function GET() {
  return run(async () => json(await getMyTeam(await requireUser())));
}

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as CreateTeamInput;
    return json(await createTeam(await requireUser(), body));
  });
}

export async function DELETE() {
  return run(async () => {
    await leaveTeam(await requireUser());
    return noContent();
  });
}
