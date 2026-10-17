import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { requirePageUser } from "@/server/session";
import { getSettings } from "@/server/services/settings";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.settings,
    queryFn: () => getSettings(user),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsClient />
    </HydrationBoundary>
  );
}
