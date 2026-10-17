import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const dynamic = "force-dynamic";
import AppShell from "@/components/layout/AppShell";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { requirePageUser } from "@/server/session";
import { listProjects } from "@/server/services/projects";

// 主布局：服务端校验登录，并预取壳层数据（用户 + 项目列表）
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  queryClient.setQueryData(queryKeys.me, user);
  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects,
    queryFn: () => listProjects(user),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AppShell>{children}</AppShell>
    </HydrationBoundary>
  );
}
