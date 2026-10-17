import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { HttpError } from "@/server/errors";
import { requirePageUser } from "@/server/session";
import { getProject, listActivities, listMembers } from "@/server/services/projects";
import { listTasks } from "@/server/services/tasks";
import type { Activity } from "@/types";
import ProjectClient from "./project-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser();
  const queryClient = getQueryClient();

  queryClient.setQueryData(queryKeys.me, user);

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.project(id),
        queryFn: () => getProject(user, id),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.tasks(id),
        queryFn: () => listTasks(user, id),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.activities(id),
        queryFn: () => listActivities(user, id).catch(() => [] as Activity[]),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.members(id),
        queryFn: () => listMembers(user, id),
      }),
    ]);
  } catch (error) {
    if (error instanceof HttpError && (error.status === 403 || error.status === 404)) {
      redirect("/dashboard");
    }
    throw error;
  }

  if (!queryClient.getQueryData(queryKeys.project(id))) {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectClient projectId={id} />
    </HydrationBoundary>
  );
}
