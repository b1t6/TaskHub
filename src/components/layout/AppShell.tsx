"use client";

import {
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  Spin,
  Tooltip,
  Typography,
  App as AntdApp,
} from "antd";
import {
  AppstoreOutlined,
  BarChartOutlined,
  FolderOutlined,
  HomeOutlined,
  LogoutOutlined,
  MoonOutlined,
  PlusOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { prefetchProject, queryKeys } from "@/lib/queries";
import { avatarColor } from "@/lib/utils";
import CreateProjectModal from "@/components/project/CreateProjectModal";
import { useTheme } from "@/components/Providers";

const { Sider, Header, Content } = Layout;

const WORKSPACE_ROUTES = ["/dashboard", "/groups", "/team", "/reports", "/settings"];

function selectedKey(pathname: string): string {
  if (pathname.startsWith("/projects/")) return pathname;
  if (pathname.startsWith("/groups")) return "/groups";
  if (pathname.startsWith("/team")) return "/team";
  if (pathname.startsWith("/reports")) return "/reports";
  if (pathname.startsWith("/settings")) return "/settings";
  if (pathname.startsWith("/dashboard")) return "/dashboard";
  return pathname;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { message } = AntdApp.useApp();
  const { mode, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // 用户与项目列表由 layout 服务端注入；此处复用缓存，避免进页后再打一轮接口
  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.me(),
    retry: false,
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.listProjects(),
    enabled: Boolean(meQuery.data),
  });

  const user = meQuery.data ?? null;
  const projects = projectsQuery.data ?? [];

  useEffect(() => {
    for (const href of WORKSPACE_ROUTES) router.prefetch(href);
  }, [router]);

  useEffect(() => {
    if (!user || projects.length === 0) return;
    for (const project of projects) {
      router.prefetch(`/projects/${project.id}`);
    }
  }, [router, user, projects]);

  const menuItems = useMemo(
    () => [
      {
        key: "workspace",
        type: "group" as const,
        label: "工作区",
        children: [
          { key: "/dashboard", icon: <HomeOutlined />, label: "工作台" },
          { key: "/groups", icon: <AppstoreOutlined />, label: "项目组" },
          { key: "/team", icon: <TeamOutlined />, label: "团队" },
          { key: "/reports", icon: <BarChartOutlined />, label: "报告" },
          { key: "/settings", icon: <SettingOutlined />, label: "设置" },
        ],
      },
      {
        key: "projects",
        type: "group" as const,
        label: "我的项目",
        children: projects.map((project) => ({
          key: `/projects/${project.id}`,
          icon: <FolderOutlined />,
          label: (
            <span onMouseEnter={() => prefetchProject(queryClient, project.id)}>{project.name}</span>
          ),
        })),
      },
    ],
    [projects, queryClient]
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme={mode === "dark" ? "dark" : "light"}
        width={220}
        style={{ background: "var(--surface)" }}
        className="border-r border-gray-200"
      >
        <div className="flex h-16 items-center justify-center gap-2 border-b border-gray-100">
          <span className="text-xl font-bold text-blue-600">TaskHub</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey(pathname)]}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith("/")) router.push(key);
          }}
        />
        <div className="px-4 py-3">
          <button
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 py-1.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
            onClick={() => setCreateOpen(true)}
          >
            <PlusOutlined /> {!collapsed && "新建项目"}
          </button>
        </div>
      </Sider>
      <Layout style={{ background: "var(--background)" }}>
        <Header
          style={{ background: "var(--surface)", paddingInline: 24 }}
          className="flex items-center justify-between border-b border-gray-200"
        >
          <Typography.Text strong className="text-base">
            任务协作平台
            {user.teamName ? (
              <span className="ml-2 text-sm font-normal text-gray-400">· {user.teamName}</span>
            ) : null}
          </Typography.Text>
          <div className="flex items-center gap-2">
            <Tooltip title={mode === "dark" ? "切换为浅色" : "切换为深色"}>
              <Button
                type="text"
                aria-label="切换主题"
                icon={mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "退出登录",
                    onClick: async () => {
                      await api.logout();
                      queryClient.clear();
                      router.replace("/login");
                    },
                  },
                ],
              }}
            >
              <span className="flex cursor-pointer items-center gap-2">
                <Avatar style={{ backgroundColor: avatarColor(user.id) }}>
                  {user.username.slice(0, 1)}
                </Avatar>
                {user.username}
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: "var(--background)" }}>{children}</Content>
      </Layout>
      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          message.success("项目创建成功");
        }}
      />
    </Layout>
  );
}
