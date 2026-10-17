import type { QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Activity } from "@/types";

export const queryKeys = {
  me: ["me"] as const,
  projects: ["projects"] as const,
  teamProjects: ["team-projects"] as const,
  team: ["team"] as const,
  reports: (scope: "personal" | "team") => ["reports", scope] as const,
  settings: ["settings"] as const,
  project: (projectId: string) => ["project", projectId] as const,
  tasks: (projectId: string) => ["tasks", projectId] as const,
  activities: (projectId: string) => ["activities", projectId] as const,
  members: (projectId: string) => ["members", projectId] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
};

export function prefetchWorkspace(client: QueryClient) {
  void client.prefetchQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.listProjects(),
  });
  void client.prefetchQuery({
    queryKey: queryKeys.teamProjects,
    queryFn: () => api.listTeamProjects(),
  });
  void client.prefetchQuery({
    queryKey: queryKeys.team,
    queryFn: () => api.getTeam(),
  });
  void client.prefetchQuery({
    queryKey: queryKeys.reports("personal"),
    queryFn: () => api.listReports("personal"),
  });
  void client.prefetchQuery({
    queryKey: queryKeys.reports("team"),
    queryFn: () => api.listReports("team"),
  });
  void client.prefetchQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });
}

export function prefetchProject(client: QueryClient, projectId: string) {
  return Promise.all([
    client.prefetchQuery({
      queryKey: queryKeys.project(projectId),
      queryFn: () => api.getProject(projectId),
    }),
    client.prefetchQuery({
      queryKey: queryKeys.tasks(projectId),
      queryFn: () => api.listTasks(projectId),
    }),
    client.prefetchQuery({
      queryKey: queryKeys.activities(projectId),
      queryFn: () => api.listActivities(projectId).catch(() => [] as Activity[]),
    }),
    client.prefetchQuery({
      queryKey: queryKeys.members(projectId),
      queryFn: () => api.listMembers(projectId),
    }),
  ]);
}

export function prefetchProjects(client: QueryClient, projectIds: string[]) {
  const queue = [...projectIds];
  const worker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) return;
      await prefetchProject(client, id);
    }
  };
  void worker();
  void worker();
}

export function prefetchComments(client: QueryClient, taskId: string) {
  void client.prefetchQuery({
    queryKey: queryKeys.comments(taskId),
    queryFn: () => api.listComments(taskId),
  });
}
