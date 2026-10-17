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

export interface ApiClient {
  login(input: LoginInput): Promise<AuthResult>;
  register(input: RegisterInput): Promise<AuthResult>;
  me(): Promise<User | null>;
  logout(): Promise<void>;

  listProjects(): Promise<Project[]>;
  listTeamProjects(): Promise<TeamProjectCard[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(projectId: string): Promise<ProjectDetail>;
  deleteProject(projectId: string): Promise<void>;
  joinProject(input: JoinProjectInput): Promise<Project>;
  joinTeamProject(projectId: string): Promise<Project>;
  updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project>;
  assignProjectTeam(projectId: string, teamId: string | null): Promise<Project>;
  listMembers(projectId: string): Promise<Member[]>;
  updateMemberRole(projectId: string, userId: string, role: MemberRole): Promise<void>;
  removeMember(projectId: string, userId: string): Promise<void>;

  listTasks(projectId: string, filters?: TaskFilters): Promise<Task[]>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(taskId: string, patch: UpdateTaskInput): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;

  listComments(taskId: string): Promise<Comment[]>;
  addComment(input: CreateCommentInput): Promise<Comment>;
  listActivities(projectId: string): Promise<Activity[]>;
  createLabel(input: CreateLabelInput): Promise<Label>;

  getTeam(): Promise<TeamInfo | null>;
  createTeam(input: CreateTeamInput): Promise<TeamInfo>;
  joinTeam(input: JoinTeamInput): Promise<TeamInfo>;
  leaveTeam(): Promise<void>;

  listReports(scope: "personal" | "team"): Promise<ReportItem[]>;
  createReport(input: CreateReportInput): Promise<ReportItem>;
  updateReport(reportId: string, input: UpdateReportInput): Promise<ReportItem>;
  deleteReport(reportId: string): Promise<void>;

  getSettings(): Promise<UserSettings>;
  updateSettings(input: UpdateSettingsInput): Promise<UserSettings>;
}
