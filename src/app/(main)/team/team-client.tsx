"use client";

import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Tag,
  App as AntdApp,
} from "antd";
import { CopyOutlined, PlusOutlined, UserAddOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { avatarColor } from "@/lib/utils";

export default function TeamClient() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
  });
  const teamQuery = useQuery({
    queryKey: queryKeys.team,
    queryFn: () => api.getTeam(),
  });

  const me = meQuery.data ?? null;
  const team = teamQuery.data ?? null;
  const loading =
    (meQuery.isLoading && !meQuery.data) || (teamQuery.isLoading && teamQuery.data === undefined);

  const refreshTeamRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      queryClient.invalidateQueries({ queryKey: queryKeys.team }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teamProjects }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
    ]);
  };

  const createTeam = useMutation({
    mutationFn: (values: { name: string }) => api.createTeam(values),
    onSuccess: async () => {
      setCreateOpen(false);
      message.success("团队创建成功");
      await refreshTeamRelated();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "创建失败"),
  });

  const joinTeam = useMutation({
    mutationFn: (values: { code: string }) => api.joinTeam(values),
    onSuccess: async (joined) => {
      setJoinOpen(false);
      message.success(`已加入「${joined.name}」`);
      await refreshTeamRelated();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "加入失败"),
  });

  const leaveTeam = useMutation({
    mutationFn: () => api.leaveTeam(),
    onSuccess: async () => {
      message.success("已退出团队");
      await refreshTeamRelated();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "退出失败"),
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">团队</h1>
          <p className="mt-1 text-sm text-gray-500">
            积力之所举，则无不胜也；众智之所为，则无不成也。
          </p>
        </div>
        {!team && (
          <div className="flex gap-2">
            <Button icon={<UserAddOutlined />} onClick={() => setJoinOpen(true)}>
              加入团队
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              创建团队
            </Button>
          </div>
        )}
      </div>

      {!team ? (
        <Empty
          description="你还没有加入任何团队"
          className="rounded-lg border border-dashed border-gray-200 bg-white py-16"
        />
      ) : (
        <div className="space-y-4">
          <Card
            title={team.name}
            extra={
              <Popconfirm
                title="确定退出团队？"
                onConfirm={() => leaveTeam.mutate()}
                okButtonProps={{ loading: leaveTeam.isPending }}
              >
                <Button danger size="small">
                  退出团队
                </Button>
              </Popconfirm>
            }
          >
            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>
                团队邀请码：
                <Tag className="ml-1 font-mono text-base">{team.code}</Tag>
                <CopyOutlined
                  className="cursor-pointer text-blue-500"
                  onClick={() => {
                    navigator.clipboard?.writeText(team.code);
                    message.success("邀请码已复制");
                  }}
                />
              </span>
              <span>成员 {team.members.length} 人</span>
              {me?.id === team.ownerId && <Tag color="gold">你是所有者</Tag>}
            </div>
            <p className="text-xs text-gray-400">持码以邀，同人共事。</p>
          </Card>

          <Card title="团队成员" size="small">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {team.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <Avatar style={{ backgroundColor: avatarColor(m.id) }}>
                    {m.username.slice(0, 1)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {m.username}
                      {m.isOwner && (
                        <Tag color="gold" className="ml-2">
                          所有者
                        </Tag>
                      )}
                    </div>
                    <div className="truncate text-xs text-gray-400">{m.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal
        title="创建团队"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={(values) => createTeam.mutate(values)} className="pt-2">
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: "请输入团队名称" }]}
          >
            <Input placeholder="例如：产品一组" maxLength={50} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createTeam.isPending}>
            创建
          </Button>
        </Form>
      </Modal>

      <Modal
        title="加入团队"
        open={joinOpen}
        onCancel={() => setJoinOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={(values) => joinTeam.mutate(values)} className="pt-2">
          <Form.Item
            name="code"
            label="团队邀请码"
            rules={[{ required: true, message: "请输入邀请码" }]}
          >
            <Input placeholder="输入 6 位邀请码" maxLength={12} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={joinTeam.isPending}>
            加入
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
