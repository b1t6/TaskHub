"use client";

import { Avatar, Button, Card, Empty, Progress, Tag, App as AntdApp } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { avatarColor, notifyProjectsChanged } from "@/lib/utils";
import type { ProjectStatus, TeamProjectCard } from "@/types";

const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  ACTIVE: { label: "进行中", color: "processing" },
  PAUSED: { label: "已暂停", color: "warning" },
  COMPLETED: { label: "已完成", color: "success" },
};

export default function GroupsPage() {
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const [items, setItems] = useState<TeamProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.listTeamProjects());
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (projectId: string) => {
    setJoiningId(projectId);
    try {
      const project = await api.joinTeamProject(projectId);
      message.success(`已加入「${project.name}」`);
      notifyProjectsChanged();
      router.push(`/projects/${project.id}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加入失败");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">项目组</h1>
        <p className="mt-1 text-sm text-gray-500">
          山海可观，进退可见。诸团队之项目与进度，一览无余。
        </p>
      </div>

      {loading ? null : items.length === 0 ? (
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
                  <Button block onClick={() => router.push(`/projects/${item.id}`)}>
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
