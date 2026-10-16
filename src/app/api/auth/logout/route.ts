import { json, run } from "@/server/http";

export async function POST() {
  return run(async () => json(null, 200, { clearSession: true }));
}
