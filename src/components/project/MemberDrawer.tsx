"use client";

import { Avatar, Button, Drawer, Popconfirm, Select, Tag, App as AntdApp } from "antd";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { avatarColor } from "@/lib/utils";
import type { Member, MemberRole, ProjectDetail } from "@/types";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!project) return;
    setLoading(true);
    try {
      setMembers(await api.listMembers(project.id));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加载成员失败");
    } finally {
      setLoading(false);
    }
  }, [project, message]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const canManage = project?.myRole === "OWNER" || project?.myRole === "ADMIN";
  const isOwner = project?.myRole === "OWNER";

  const handleRoleChange = async (userId: string, role: MemberRole) => {
    try {
      await api.updateMemberRole(project!.id, userId, role);
      message.success("角色已更新");
      load();
      onChanged();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "更新失败");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await api.removeMember(project!.id, userId);
      message.success("已移除成员");
      load();
      onChanged();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "移除失败");
    }
  };

  return (
    <Drawer title="项目成员" open={open} onClose={onClose} width={360} loading={loading}>
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
                onChange={(role) => handleRoleChange(member.id, role)}
                options={[
                  { value: "ADMIN", label: ROLE_LABEL.ADMIN },
                  { value: "MEMBER", label: ROLE_LABEL.MEMBER },
                ]}
              />
            )}
            {canManage && member.role !== "OWNER" && (
              <Popconfirm title="确定移除该成员？" onConfirm={() => handleRemove(member.id)}>
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
