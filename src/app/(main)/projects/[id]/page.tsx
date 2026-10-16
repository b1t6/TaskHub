"use client";

import { Button, Skeleton, Tag, App as AntdApp } from "antd";
import { CopyOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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
import type { Activity, ProjectDetail, Task, User } from "@/types";

// 项目详情：统计筛选 + 任务列表 + 侧栏动态
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { message } = AntdApp.useApp();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statKey, setStatKey] = useState<StatKey>("all");
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [memberOpen, setMemberOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const loadProject = useCallback(async () => {
    try {
      const [detail, current] = await Promise.all([api.getProject(id), api.me()]);
      setProject(detail);
      setMe(current);
      return detail;
    } catch (e) {
      message.error(e instanceof Error ? e.message : "项目加载失败");
      router.replace("/dashboard");
      return null;
    }
  }, [id, message, router]);

  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      setTasks(await api.listTasks(id));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "任务加载失败");
    } finally {
      setLoadingTasks(false);
    }
  }, [id, message]);

  const loadActivities = useCallback(async () => {
    try {
      setActivities(await api.listActivities(id));
    } catch {
      // 动态加载失败不阻塞页面
    }
  }, [id]);

  const reloadAll = useCallback(() => {
    loadProject();
    loadTasks();
    loadActivities();
  }, [loadProject, loadTasks, loadActivities]);

  useEffect(() => {
    loadProject().then((detail) => {
      if (detail) loadTasks();
      loadActivities();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      {/* 项目头部 */}
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
                onClick={async () => {
                  try {
                    await api.assignProjectTeam(project.id, me.teamId!);
                    message.success("项目已归属到你的团队");
                    reloadAll();
                  } catch (e) {
                    message.error(e instanceof Error ? e.message : "归属失败");
                  }
                }}
              >
                归属到「{me.teamName || "我的团队"}」
              </Button>
            )}
            {project.myRole === "OWNER" && project.teamId && (
              <Button
                size="small"
                onClick={async () => {
                  try {
                    await api.assignProjectTeam(project.id, null);
                    message.success("已取消团队归属");
                    reloadAll();
                  } catch (e) {
                    message.error(e instanceof Error ? e.message : "操作失败");
                  }
                }}
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

      <ProjectStatFilter
        stats={stats}
        percent={percent}
        active={statKey}
        onChange={setStatKey}
      />

      <TaskQuickList
        tasks={filteredByStat}
        loading={loadingTasks}
        title={STAT_TITLES[statKey]}
        onOpenTask={(t) => setDetailTask(t)}
        footer={<ProjectActivity activities={activities} />}
      />

      <MemberDrawer
        open={memberOpen}
        onClose={() => setMemberOpen(false)}
        project={project}
        onChanged={reloadAll}
      />

      <TaskFormModal
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        project={project}
        onCreated={() => {
          setTaskFormOpen(false);
          reloadAll();
        }}
      />

      <TaskDetailDrawer
        open={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        project={project}
        onChanged={reloadAll}
      />
    </div>
  );
}
