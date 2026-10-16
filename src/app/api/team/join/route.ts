import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { joinTeam } from "@/server/services/teams";
import type { JoinTeamInput } from "@/types";

export async function POST(req: Request) {
  return run(async () => {
    const body = (await req.json()) as JoinTeamInput;
    return json(await joinTeam(await requireUser(), body));
  });
}
