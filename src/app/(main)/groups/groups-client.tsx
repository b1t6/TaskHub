"use client";

import { Avatar, Button, Card, Empty, Progress, Skeleton, Tag, App as AntdApp } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { prefetchProject, queryKeys } from "@/lib/queries";
import { avatarColor } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  ACTIVE: { label: "进行中", color: "processing" },
  PAUSED: { label: "已暂停", color: "warning" },
  COMPLETED: { label: "已完成", color: "success" },
};

export default function GroupsClient() {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.teamProjects,
    queryFn: () => api.listTeamProjects(),
  });
  const items = listQuery.data ?? [];
  const loading = listQuery.isLoading && !listQuery.data;

  const joinMutation = useMutation({
    mutationFn: (projectId: string) => api.joinTeamProject(projectId),
    onSuccess: (project) => {
      message.success(`已加入「${project.name}」`);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamProjects });
      prefetchProject(queryClient, project.id);
      router.push(`/projects/${project.id}`);
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "加入失败"),
    onSettled: () => setJoiningId(null),
  });

  const join = (projectId: string) => {
    setJoiningId(projectId);
    joinMutation.mutate(projectId);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">项目组</h1>
        <p className="mt-1 text-sm text-gray-500">
          山海可观，进退可见。诸团队之项目与进度，一览无余。
        </p>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : items.length === 0 ? (
        <Empty
          description="还没有归属到团队的项目"
          className="rounded-lg border border-dashed border-gray-200 bg-white py-16"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            return (
              <Card
                key={item.id}
                hoverable
                className="h-full"
                title={
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.name}</span>
                    <Tag color={meta.color}>{meta.label}</Tag>
                  </div>
                }
              >
                <p className="mb-4 line-clamp-2 min-h-10 text-sm text-gray-500">
                  {item.description || "暂无简介"}
                </p>
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <Avatar size={28} style={{ backgroundColor: avatarColor(item.owner.id) }}>
                    {item.owner.username.slice(0, 1)}
                  </Avatar>
                  <div>
                    <div className="font-medium">{item.owner.username}</div>
                    <div className="text-xs text-gray-400">项目所有者</div>
                  </div>
                </div>
                <div className="mb-3 text-xs text-gray-400">{item.teamName}</div>
                <Progress
                  percent={
                    item.taskStats.total
                      ? Math.round((item.taskStats.done / item.taskStats.total) * 100)
                      : 0
                  }
                  size="small"
                />
                <div className="mb-4 mt-2 flex justify-between text-xs text-gray-400">
                  <span>{item.memberCount} 名成员</span>
                  <span>
                    {item.taskStats.done}/{item.taskStats.total} 已完成 · 进行中{" "}
                    {item.taskStats.inProgress}
                  </span>
                </div>
                {item.joined ? (
                  <Button
                    block
                    onMouseEnter={() => prefetchProject(queryClient, item.id)}
                    onClick={() => router.push(`/projects/${item.id}`)}
                  >
                    进入项目
                  </Button>
                ) : item.canJoin ? (
                  <Button
                    type="primary"
                    block
                    loading={joiningId === item.id}
                    onClick={() => join(item.id)}
                  >
                    加入协作
                  </Button>
                ) : (
                  <Button block disabled>
                    仅可查看进度
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
