"use client";

import { Button, Skeleton, Tag, App as AntdApp } from "antd";
import { CopyOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { prefetchComments, queryKeys } from "@/lib/queries";
import { isOverdue } from "@/lib/utils";
import TaskQuickList from "@/components/task/TaskQuickList";
import TaskFormModal from "@/components/task/TaskFormModal";
import TaskDetailDrawer from "@/components/task/TaskDetailDrawer";
import MemberDrawer from "@/components/project/MemberDrawer";
import ProjectActivity from "@/components/project/ProjectActivity";
import ProjectStatFilter, {
  STAT_TITLES,
  type StatKey,
} from "@/components/project/ProjectStatFilter";
import type { Activity, Task } from "@/types";

// 项目详情：统计筛选 + 任务列表 + 侧栏动态（客户端交互）
export default function ProjectClient({ projectId }: { projectId: string }) {
  const id = projectId;
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();

  const [statKey, setStatKey] = useState<StatKey>("all");
  const [memberOpen, setMemberOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  useEffect(() => {
    setStatKey("all");
    setDetailTask(null);
    setMemberOpen(false);
    setTaskFormOpen(false);
  }, [id]);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
  });
  const projectQuery = useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
  });
  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(id),
    queryFn: () => api.listTasks(id),
  });
  const activitiesQuery = useQuery({
    queryKey: queryKeys.activities(id),
    queryFn: () => api.listActivities(id).catch(() => [] as Activity[]),
  });

  useEffect(() => {
    if (projectQuery.isError) {
      message.error(
        projectQuery.error instanceof Error ? projectQuery.error.message : "项目加载失败"
      );
      router.replace("/dashboard");
    }
  }, [projectQuery.isError, projectQuery.error, message, router]);

  const project = projectQuery.data ?? null;
  const me = meQuery.data ?? null;
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const activities = activitiesQuery.data ?? [];

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    queryClient.invalidateQueries({ queryKey: queryKeys.teamProjects });
  };

  const assignTeam = useMutation({
    mutationFn: (teamId: string | null) => api.assignProjectTeam(id, teamId),
    onSuccess: (_data, teamId) => {
      message.success(teamId ? "项目已归属到你的团队" : "已取消团队归属");
      invalidateProject();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "操作失败"),
  });

  const filteredByStat = useMemo(() => {
    if (statKey === "all") return tasks;
    if (statKey === "overdue") return tasks.filter((t) => isOverdue(t));
    return tasks.filter((t) => t.status === statKey);
  }, [tasks, statKey]);

  if (!project) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const stats = project.taskStats;
  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <Tag>
              {project.myRole === "OWNER"
                ? "所有者"
                : project.myRole === "ADMIN"
                  ? "管理员"
                  : "成员"}
            </Tag>
          </div>
          <p className="mt-1 text-sm text-gray-500">{project.description || "暂无描述"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>团队归属：{project.teamName || "未归属"}</span>
            {project.myRole === "OWNER" && me?.teamId && project.teamId !== me.teamId && (
              <Button
                size="small"
                loading={assignTeam.isPending}
                onClick={() => assignTeam.mutate(me.teamId!)}
              >
                归属到「{me.teamName || "我的团队"}」
              </Button>
            )}
            {project.myRole === "OWNER" && project.teamId && (
              <Button
                size="small"
                loading={assignTeam.isPending}
                onClick={() => assignTeam.mutate(null)}
              >
                取消归属
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center text-sm text-gray-400">
            <CopyOutlined
              className="mr-1 cursor-pointer hover:text-blue-500"
              onClick={() => {
                navigator.clipboard?.writeText(project.inviteCode);
                message.success("邀请码已复制");
              }}
            />
            {project.inviteCode}
          </span>
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <TeamOutlined className="text-gray-400" />
            {project.teamName || "未归属"}
          </span>
          <Button size="small" onClick={() => setMemberOpen(true)}>
            成员
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setTaskFormOpen(true)}>
            新建任务
          </Button>
        </div>
      </div>

      <ProjectStatFilter stats={stats} percent={percent} active={statKey} onChange={setStatKey} />

      <TaskQuickList
        tasks={filteredByStat}
        loading={tasksQuery.isLoading && !tasksQuery.data}
        title={STAT_TITLES[statKey]}
        onOpenTask={(t) => {
          prefetchComments(queryClient, t.id);
          setDetailTask(t);
        }}
        footer={<ProjectActivity activities={activities} />}
      />

      <MemberDrawer
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        project={project}
        onChanged={invalidateProject}
      />

      <TaskFormModal
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        project={project}
        onCreated={() => {
          setTaskFormOpen(false);
          invalidateProject();
        }}
      />

      <TaskDetailDrawer
        open={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        project={project}
        onChanged={invalidateProject}
      />
    </div>
  );
}
