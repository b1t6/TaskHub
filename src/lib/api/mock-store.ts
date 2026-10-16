import type {
  Label,
  MemberRole,
  Project,
  ProjectStats,
  Task,
  TaskStatus,
  User,
} from "@/types";

// ============================================================
// Mock 内存数据库：仅 NEXT_PUBLIC_API_MODE=mock 时使用
// 作用：让前端在真实后端（Route Handlers）就绪前独立开发运行
// 后端就绪后本文件可整体删除
// ============================================================

const now = () => new Date().toISOString();
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 86400000).toISOString();

let seq = 100;
const nextId = (prefix: string) => `${prefix}_${++seq}`;

export interface MockUser extends User {
  password: string;
}

export interface MockMembership {
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface MockTask {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Task["priority"];
  dueDate?: string | null;
  assigneeId?: string | null;
  creatorId: string;
  labelIds: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface MockActivity {
  id: string;
  projectId: string;
  taskId?: string | null;
  type: string;
  content: string;
  userId: string;
  createdAt: string;
}

// ---------- 种子数据 ----------

const users: MockUser[] = [
  { id: "u1", email: "zhang@demo.com", username: "张伟", password: "123456", avatarUrl: null },
  { id: "u2", email: "li@demo.com", username: "李娜", password: "123456", avatarUrl: null },
  { id: "u3", email: "wang@demo.com", username: "王强", password: "123456", avatarUrl: null },
];

const memberships: MockMembership[] = [
  { projectId: "p1", userId: "u1", role: "OWNER", joinedAt: daysFromNow(-30) },
  { projectId: "p1", userId: "u2", role: "ADMIN", joinedAt: daysFromNow(-28) },
  { projectId: "p1", userId: "u3", role: "MEMBER", joinedAt: daysFromNow(-20) },
  { projectId: "p2", userId: "u1", role: "OWNER", joinedAt: daysFromNow(-15) },
  { projectId: "p2", userId: "u2", role: "MEMBER", joinedAt: daysFromNow(-10) },
];

const projects: Project[] = [
  {
    id: "p1",
    name: "官网改版",
    description: "公司官网视觉与交互全面升级",
    ownerId: "u1",
    inviteCode: "WEB2026",
    status: "ACTIVE",
    createdAt: daysFromNow(-30),
    myRole: "OWNER",
    memberCount: 3,
    taskStats: { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 },
  },
  {
    id: "p2",
    name: "移动端 App 2.0",
    description: "新版本 App 的设计与开发",
    ownerId: "u1",
    inviteCode: "APP2026",
    status: "ACTIVE",
    createdAt: daysFromNow(-15),
    myRole: "OWNER",
    memberCount: 2,
    taskStats: { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 },
  },
];

const labels: Label[] = [
  { id: "l1", projectId: "p1", name: "设计", color: "#722ed1" },
  { id: "l2", projectId: "p1", name: "前端开发", color: "#1677ff" },
  { id: "l3", projectId: "p1", name: "后端开发", color: "#13c2c2" },
  { id: "l4", projectId: "p1", name: "紧急", color: "#f5222d" },
  { id: "l5", projectId: "p2", name: "客户端", color: "#fa8c16" },
  { id: "l6", projectId: "p2", name: "体验优化", color: "#52c41a" },
];

const tasks: MockTask[] = [
  { id: "t1", projectId: "p1", title: "首页 Banner 视觉设计", description: "输出三版风格稿供评审", status: "DONE", priority: "HIGH", dueDate: daysFromNow(-5), assigneeId: "u2", creatorId: "u1", labelIds: ["l1"], position: 1000, createdAt: daysFromNow(-25), updatedAt: daysFromNow(-6) },
  { id: "t2", projectId: "p1", title: "导航栏组件重构", description: "适配响应式断点", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(3), assigneeId: "u1", creatorId: "u1", labelIds: ["l2"], position: 1000, createdAt: daysFromNow(-10), updatedAt: daysFromNow(-1) },
  { id: "t3", projectId: "p1", title: "产品详情页开发", description: null, status: "IN_PROGRESS", priority: "URGENT", dueDate: daysFromNow(-1), assigneeId: "u2", creatorId: "u1", labelIds: ["l2", "l4"], position: 2000, createdAt: daysFromNow(-9), updatedAt: daysFromNow(-2) },
  { id: "t4", projectId: "p1", title: "接口联调：用户中心", description: "依赖后端接口 v2", status: "TODO", priority: "MEDIUM", dueDate: daysFromNow(7), assigneeId: "u3", creatorId: "u2", labelIds: ["l3"], position: 1000, createdAt: daysFromNow(-7), updatedAt: daysFromNow(-7) },
  { id: "t5", projectId: "p1", title: "SEO 基础优化", description: "TDK、sitemap、结构化数据", status: "TODO", priority: "LOW", dueDate: null, assigneeId: null, creatorId: "u1", labelIds: [], position: 2000, createdAt: daysFromNow(-5), updatedAt: daysFromNow(-5) },
  { id: "t6", projectId: "p1", title: "性能优化：首屏加载小于 2s", description: null, status: "TODO", priority: "HIGH", dueDate: daysFromNow(-3), assigneeId: "u1", creatorId: "u1", labelIds: ["l2"], position: 3000, createdAt: daysFromNow(-4), updatedAt: daysFromNow(-4) },
  { id: "t7", projectId: "p2", title: "登录页改版", description: "支持手机号一键登录", status: "DONE", priority: "HIGH", dueDate: daysFromNow(-8), assigneeId: "u2", creatorId: "u1", labelIds: ["l5"], position: 1000, createdAt: daysFromNow(-14), updatedAt: daysFromNow(-8) },
  { id: "t8", projectId: "p2", title: "首页信息流卡片优化", description: "提升滑动流畅度", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: daysFromNow(2), assigneeId: "u2", creatorId: "u1", labelIds: ["l5", "l6"], position: 1000, createdAt: daysFromNow(-6), updatedAt: daysFromNow(-1) },
  { id: "t9", projectId: "p2", title: "推送服务接入", description: null, status: "TODO", priority: "URGENT", dueDate: daysFromNow(5), assigneeId: null, creatorId: "u1", labelIds: [], position: 1000, createdAt: daysFromNow(-3), updatedAt: daysFromNow(-3) },
];

const comments: MockComment[] = [
  { id: "c1", taskId: "t3", authorId: "u1", content: "这个页面比较急，优先处理一下", createdAt: daysFromNow(-2) },
  { id: "c2", taskId: "t3", authorId: "u2", content: "接口还没就绪，先做了本地 mock", createdAt: daysFromNow(-1.5) },
  { id: "c3", taskId: "t2", authorId: "u2", content: "断点规则我同步在文档里了", createdAt: daysFromNow(-1) },
];

const activities: MockActivity[] = [
  { id: "a1", projectId: "p1", taskId: "t1", type: "TASK_DONE", content: "完成了任务「首页 Banner 视觉设计」", userId: "u2", createdAt: daysFromNow(-6) },
  { id: "a2", projectId: "p1", taskId: "t3", type: "STATUS_CHANGED", content: "将「产品详情页开发」移入进行中", userId: "u2", createdAt: daysFromNow(-2) },
  { id: "a3", projectId: "p1", taskId: "t2", type: "COMMENT_ADDED", content: "评论了「导航栏组件重构」", userId: "u2", createdAt: daysFromNow(-1) },
  { id: "a4", projectId: "p2", taskId: "t8", type: "STATUS_CHANGED", content: "将「首页信息流卡片优化」移入进行中", userId: "u2", createdAt: daysFromNow(-1) },
];

// ---------- 存储访问 ----------

export const mockStore = {
  users,
  memberships,
  projects,
  labels,
  tasks,
  comments,
  activities,
  nextId,

  findUser(id?: string | null): User | undefined {
    return users.find((u) => u.id === id);
  },

  currentUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("mock.auth.user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null) {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem("mock.auth.user", JSON.stringify(user));
    else window.localStorage.removeItem("mock.auth.user");
  },

  myRole(projectId: string, userId: string | null): MemberRole | null {
    return (
      memberships.find((m) => m.projectId === projectId && m.userId === userId)
        ?.role ?? null
    );
  },

  taskStats(projectId: string): ProjectStats {
    const list = tasks.filter((t) => t.projectId === projectId);
    const overdue = list.filter(
      (t) => t.status !== "DONE" && t.dueDate && t.dueDate < now()
    ).length;
    return {
      total: list.length,
      todo: list.filter((t) => t.status === "TODO").length,
      inProgress: list.filter((t) => t.status === "IN_PROGRESS").length,
      done: list.filter((t) => t.status === "DONE").length,
      overdue,
    };
  },

  addActivity(a: Omit<MockActivity, "id" | "createdAt">) {
    activities.unshift({ ...a, id: nextId("a"), createdAt: now() });
  },
};
