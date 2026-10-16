import { currentUser } from "@/server/auth";
import { json, run } from "@/server/http";

export async function GET() {
  return run(async () => json(await currentUser()));
}
