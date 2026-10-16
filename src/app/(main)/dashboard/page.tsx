"use client";

import {
  Button,
  Card,
  Empty,
  Input,
  Progress,
  Statistic,
  App as AntdApp,
} from "antd";
import { PlusOutlined, TeamOutlined, UserAddOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { notifyProjectsChanged } from "@/lib/utils";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import type { Project } from "@/types";

// 工作台：项目总览、统计、新建/加入项目
export default function DashboardPage() {
  const { message } = AntdApp.useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await api.listProjects());
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加载项目失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = projects.reduce(
    (acc, p) => ({
      total: acc.total + p.taskStats.total,
      inProgress: acc.inProgress + p.taskStats.inProgress,
      done: acc.done + p.taskStats.done,
      overdue: acc.overdue + p.taskStats.overdue,
    }),
    { total: 0, inProgress: 0, done: 0, overdue: 0 }
  );

  const handleJoin = async () => {
    const code = inviteCode.trim();
    if (!code) return;
    setJoining(true);
    try {
      const project = await api.joinProject({ inviteCode: code });
      message.success(`已加入项目「${project.name}」`);
      setInviteCode("");
      notifyProjectsChanged();
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加入失败");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">工作台</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="输入邀请码加入项目"
            className="w-48"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            onPressEnter={handleJoin}
            prefix={<UserAddOutlined className="text-gray-300" />}
          />
          <Button loading={joining} onClick={handleJoin} disabled={!inviteCode.trim()}>
            加入项目
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建项目
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card size="small">
          <Statistic title="我的项目" value={projects.length} />
        </Card>
        <Card size="small">
          <Statistic title="全部任务" value={stats.total} />
        </Card>
        <Card size="small">
          <Statistic title="进行中" value={stats.inProgress} valueStyle={{ color: "#1677ff" }} />
        </Card>
        <Card size="small">
          <Statistic title="已逾期" value={stats.overdue} valueStyle={{ color: stats.overdue ? "#f5222d" : undefined }} />
        </Card>
      </div>

      {!loading && projects.length > 0 && <DashboardCharts projects={projects} />}

      {loading ? null : projects.length === 0 ? (
        <Empty description="还没有项目，创建一个开始吧">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建项目
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const percent = p.taskStats.total
              ? Math.round((p.taskStats.done / p.taskStats.total) * 100)
              : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card
                  hoverable
                  title={p.name}
                  className="h-full"
                  extra={<span className="text-xs text-gray-400">{p.inviteCode}</span>}
                >
                  <p className="mb-3 line-clamp-2 min-h-10 text-sm text-gray-500">
                    {p.description || "暂无描述"}
                  </p>
                  <Progress percent={percent} size="small" status={percent === 100 ? "success" : "normal"} />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {p.taskStats.done}/{p.taskStats.total} 已完成
                      {p.taskStats.overdue > 0 && (
                        <span className="ml-2 text-red-500">{p.taskStats.overdue} 逾期</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <TeamOutlined />
                      {p.teamName || "未归属"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          notifyProjectsChanged();
          load();
        }}
      />
    </div>
  );
}
