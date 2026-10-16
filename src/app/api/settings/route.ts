import { requireUser } from "@/server/auth";
import { json, run } from "@/server/http";
import { getSettings, updateSettings } from "@/server/services/settings";
import type { UpdateSettingsInput } from "@/types";

export async function GET() {
  return run(async () => json(await getSettings(await requireUser())));
}

export async function PATCH(req: Request) {
  return run(async () => {
    const body = (await req.json()) as UpdateSettingsInput;
    return json(await updateSettings(await requireUser(), body));
  });
}
