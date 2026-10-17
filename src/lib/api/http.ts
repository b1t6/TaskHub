import type {
  Activity,
  AuthResult,
  Comment,
  CreateCommentInput,
  CreateLabelInput,
  CreateProjectInput,
  CreateReportInput,
  CreateTaskInput,
  CreateTeamInput,
  JoinProjectInput,
  JoinTeamInput,
  Label,
  LoginInput,
  Member,
  MemberRole,
  Project,
  ProjectDetail,
  ProjectStatus,
  RegisterInput,
  ReportItem,
  Task,
  TaskFilters,
  TeamInfo,
  TeamProjectCard,
  UpdateReportInput,
  UpdateSettingsInput,
  UpdateTaskInput,
  User,
  UserSettings,
} from "@/types";
import type { ApiClient } from "./client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(
      res.status,
      body.message ?? `请求失败（HTTP ${res.status}）`
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const httpApi: ApiClient = {
  login: (input: LoginInput) =>
    request<AuthResult>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  register: (input: RegisterInput) =>
    request<AuthResult>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  me: () => request<User | null>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  listProjects: () => request<Project[]>("/projects"),
  listTeamProjects: () => request<TeamProjectCard[]>("/projects/team"),
  createProject: (input: CreateProjectInput) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(input) }),
  getProject: (projectId) => request<ProjectDetail>(`/projects/${projectId}`),
  deleteProject: (projectId) => request<void>(`/projects/${projectId}`, { method: "DELETE" }),
  joinProject: (input: JoinProjectInput) =>
    request<Project>("/projects/join", { method: "POST", body: JSON.stringify(input) }),
  joinTeamProject: (projectId) =>
    request<Project>(`/projects/${projectId}/join`, { method: "POST" }),
  updateProjectStatus: (projectId, status: ProjectStatus) =>
    request<Project>(`/projects/${projectId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assignProjectTeam: (projectId, teamId) =>
    request<Project>(`/projects/${projectId}/team`, {
      method: "PATCH",
      body: JSON.stringify({ teamId }),
    }),
  listMembers: (projectId) => request<Member[]>(`/projects/${projectId}/members`),
  updateMemberRole: (projectId, userId, role: MemberRole) =>
    request<void>(`/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  removeMember: (projectId, userId) =>
    request<void>(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),

  listTasks: (projectId, filters?: TaskFilters) =>
    request<Task[]>(`/projects/${projectId}/tasks${toQuery({ ...(filters ?? {}) })}`),
  createTask: (input: CreateTaskInput) =>
    request<Task>(`/projects/${input.projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateTask: (taskId, patch: UpdateTaskInput) =>
    request<Task>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteTask: (taskId) => request<void>(`/tasks/${taskId}`, { method: "DELETE" }),

  listComments: (taskId) => request<Comment[]>(`/tasks/${taskId}/comments`),
  addComment: (input: CreateCommentInput) =>
    request<Comment>(`/tasks/${input.taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listActivities: (projectId) => request<Activity[]>(`/projects/${projectId}/activities`),
  createLabel: (input: CreateLabelInput) =>
    request<Label>(`/projects/${input.projectId}/labels`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getTeam: () => request<TeamInfo | null>("/team"),
  createTeam: (input: CreateTeamInput) =>
    request<TeamInfo>("/team", { method: "POST", body: JSON.stringify(input) }),
  joinTeam: (input: JoinTeamInput) =>
    request<TeamInfo>("/team/join", { method: "POST", body: JSON.stringify(input) }),
  leaveTeam: () => request<void>("/team", { method: "DELETE" }),

  listReports: (scope) => request<ReportItem[]>(`/reports${toQuery({ scope })}`),
  createReport: (input: CreateReportInput) =>
    request<ReportItem>("/reports", { method: "POST", body: JSON.stringify(input) }),
  updateReport: (reportId, input: UpdateReportInput) =>
    request<ReportItem>(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteReport: (reportId) => request<void>(`/reports/${reportId}`, { method: "DELETE" }),

  getSettings: () => request<UserSettings>("/settings"),
  updateSettings: (input: UpdateSettingsInput) =>
    request<UserSettings>("/settings", { method: "PATCH", body: JSON.stringify(input) }),
};
