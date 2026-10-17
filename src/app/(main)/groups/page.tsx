import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { requirePageUser } from "@/server/session";
import { listTeamProjects } from "@/server/services/projects";
import GroupsClient from "./groups-client";

/** 首次进入时服务端注入；返回本页时 React Query 缓存可秒开 */
export default async function GroupsPage() {
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.teamProjects,
    queryFn: () => listTeamProjects(user),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <GroupsClient />
    </HydrationBoundary>
  );
}
