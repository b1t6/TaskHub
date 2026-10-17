import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { requirePageUser } from "@/server/session";
import { getMyTeam } from "@/server/services/teams";
import TeamClient from "./team-client";

export default async function TeamPage() {
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  queryClient.setQueryData(queryKeys.me, user);
  await queryClient.prefetchQuery({
    queryKey: queryKeys.team,
    queryFn: () => getMyTeam(user),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamClient />
    </HydrationBoundary>
  );
}
