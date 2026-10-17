"use client";

import { Avatar, Button, Drawer, Popconfirm, Select, Tag, App as AntdApp } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { avatarColor } from "@/lib/utils";
import type { MemberRole, ProjectDetail } from "@/types";

const ROLE_LABEL: Record<MemberRole, string> = {
  OWNER: "所有者",
  ADMIN: "管理员",
  MEMBER: "成员",
};

export default function MemberDrawer({
  open,
  onClose,
  project,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail | null;
  onChanged: () => void;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const projectId = project?.id;

  const membersQuery = useQuery({
    queryKey: queryKeys.members(projectId ?? ""),
    queryFn: () => api.listMembers(projectId!),
    enabled: open && Boolean(projectId),
  });
  const members = membersQuery.data ?? [];

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      api.updateMemberRole(projectId!, userId, role),
    onSuccess: () => {
      message.success("角色已更新");
      queryClient.invalidateQueries({ queryKey: queryKeys.members(projectId!) });
      onChanged();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "更新失败"),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => api.removeMember(projectId!, userId),
    onSuccess: () => {
      message.success("已移除成员");
      queryClient.invalidateQueries({ queryKey: queryKeys.members(projectId!) });
      onChanged();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "移除失败"),
  });

  const canManage = project?.myRole === "OWNER" || project?.myRole === "ADMIN";
  const isOwner = project?.myRole === "OWNER";

  return (
    <Drawer
      title="项目成员"
      open={open}
      onClose={onClose}
      width={360}
      loading={membersQuery.isLoading && !membersQuery.data}
    >
      <ul className="divide-y divide-gray-100">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 py-3">
            <Avatar style={{ backgroundColor: avatarColor(member.id) }}>
              {member.username.slice(0, 1)}
            </Avatar>
            <span className="min-w-0 flex-1 truncate font-medium">{member.username}</span>
            {member.role === "OWNER" || !isOwner ? (
              <Tag color={member.role === "OWNER" ? "gold" : "default"} className="mr-0">
                {ROLE_LABEL[member.role]}
              </Tag>
            ) : (
              <Select<MemberRole>
                value={member.role}
                size="small"
                style={{ width: 88 }}
                onChange={(role) => updateRole.mutate({ userId: member.id, role })}
                options={[
                  { value: "ADMIN", label: ROLE_LABEL.ADMIN },
                  { value: "MEMBER", label: ROLE_LABEL.MEMBER },
                ]}
              />
            )}
            {canManage && member.role !== "OWNER" && (
              <Popconfirm
                title="确定移除该成员？"
                onConfirm={() => removeMember.mutate(member.id)}
              >
                <Button type="link" danger size="small" className="px-0">
                  移除
                </Button>
              </Popconfirm>
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
