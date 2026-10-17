import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { requirePageUser } from "@/server/session";
import { listReports } from "@/server/services/reports";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  // 只预取默认 Tab，避免进页时打两次库
  await queryClient.prefetchQuery({
    queryKey: queryKeys.reports("personal"),
    queryFn: () => listReports(user, "personal"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsClient />
    </HydrationBoundary>
  );
}
