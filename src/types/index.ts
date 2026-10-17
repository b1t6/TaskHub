// ==========================================================
// API 契约类型（前后端共享的唯一数据定义）
// 前端只允许依赖本文件与 src/lib/api，禁止直接访问数据库
// ==========================================================

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type ProjectStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  teamId?: string | null;
  teamName?: string | null;
}

export interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  taskId?: string | null;
  type: string;
  content: string;
  user: User;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignee?: User | null;
  creator: User;
  labels: Label[];
  position: number;
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
}

export interface ProjectStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  teamId?: string | null;
  teamName?: string | null;
  inviteCode: string;
  status: ProjectStatus;
  createdAt: string;
  myRole: MemberRole;
  memberCount: number;
  taskStats: ProjectStats;
}

export interface Member extends User {
  role: MemberRole;
  joinedAt: string;
}

export interface ProjectDetail extends Project {
  members: Member[];
  labels: Label[];
}

// ---------- 输入 DTO ----------

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface JoinProjectInput {
  inviteCode: string;
}

export interface TaskFilters {
  keyword?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  labelId?: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  labelIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
  labelIds?: string[];
  position?: number;
}

export interface CreateCommentInput {
  taskId: string;
  content: string;
}

export interface CreateLabelInput {
  projectId: string;
  name: string;
  color: string;
}

export interface CreateTeamInput {
  name: string;
}

export interface JoinTeamInput {
  code: string;
}

export interface CreateReportInput {
  title: string;
  content: string;
}

export interface UpdateReportInput {
  title?: string;
  content?: string;
}

export interface UpdateSettingsInput {
  username?: string;
  notifyDue?: boolean;
  notifyComment?: boolean;
  weekStart?: number;
  avatarUrl?: string | null;
}

export interface UpdateProjectInput {
  status?: ProjectStatus;
}

export interface TeamProjectCard {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  teamId: string;
  teamName: string;
  owner: User;
  memberCount: number;
  taskStats: ProjectStats;
  joined: boolean;
  canJoin: boolean;
}

export interface TeamMember {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  isOwner: boolean;
}

export interface TeamInfo {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  members: TeamMember[];
}

export interface ReportItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  mine: boolean;
}

export interface UserSettings {
  username: string;
  email: string;
  avatarUrl?: string | null;
  notifyDue: boolean;
  notifyComment: boolean;
  weekStart: number;
  teamName?: string | null;
}
