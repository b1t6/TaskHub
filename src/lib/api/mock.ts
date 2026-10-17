import type {
  Activity,
  AuthResult,
  Comment,
  CreateCommentInput,
  CreateLabelInput,
  CreateProjectInput,
  CreateTaskInput,
  JoinProjectInput,
  Label,
  LoginInput,
  Member,
  MemberRole,
  Project,
  ProjectDetail,
  RegisterInput,
  Task,
  TaskFilters,
  UpdateTaskInput,
  User,
} from "@/types";
import type { ApiClient } from "./client";
import { isAdjacentStatus, statusTransitionMessage } from "@/lib/task-status";
import { mockStore as store } from "./mock-store";

// Mock 实现：完全基于内存数据，接口行为与真实后端保持一致
// 让前端在 Route Handlers 就绪前可独立开发与演示

function requireUser(): User {
  const user = store.currentUser();
  if (!user) throw new Error("未登录，请先登录");
  return user;
}

function toTask(t: (typeof store.tasks)[number]): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    assignee: store.findUser(t.assigneeId) ?? null,
    creator: store.findUser(t.creatorId) as User,
    labels: store.labels.filter((l) => t.labelIds.includes(l.id)),
    position: t.position,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    commentCount: store.comments.filter((c) => c.taskId === t.id).length,
  };
}

function toMember(m: (typeof store.memberships)[number]): Member {
  return {
    ...(store.findUser(m.userId) as User),
    role: m.role,
    joinedAt: m.joinedAt,
  };
}

function toProject(p: (typeof store.projects)[number], userId: string): Project {
  return {
    ...p,
    status: (p as { status?: Project["status"] }).status ?? "ACTIVE",
    myRole: store.myRole(p.id, userId) ?? "MEMBER",
    memberCount: store.memberships.filter((m) => m.projectId === p.id).length,
    taskStats: store.taskStats(p.id),
  };
}

function assertProjectMember(projectId: string, user: User) {
  if (!store.myRole(projectId, user.id)) throw new Error("无权访问该项目");
}

export const mockApi: ApiClient = {
  // ---------- 认证 ----------
  async login(input: LoginInput): Promise<AuthResult> {
    let user = store.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase()
    );
    if (!user) {
      // 演示模式：未注册邮箱自动创建账号
      user = {
        id: store.nextId("u"),
        email: input.email,
        username: input.email.split("@")[0],
        password: input.password,
        avatarUrl: null,
      };
      store.users.push(user);
    }
    const safe: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    };
    store.setCurrentUser(safe);
    return { user: safe, token: "mock-token" };
  },

  async register(input: RegisterInput): Promise<AuthResult> {
    if (store.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error("该邮箱已被注册");
    const user: User = {
      id: store.nextId("u"),
      email: input.email,
      username: input.username,
      avatarUrl: null,
    };
    store.users.push({ ...user, password: input.password });
    store.setCurrentUser(user);
    return { user, token: "mock-token" };
  },

  async me(): Promise<User | null> {
    return store.currentUser();
  },

  async logout(): Promise<void> {
    store.setCurrentUser(null);
  },

  // ---------- 项目 ----------
  async listProjects(): Promise<Project[]> {
    const user = requireUser();
    return store.projects
      .filter((p) => store.myRole(p.id, user.id))
      .map((p) => toProject(p, user.id));
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const user = requireUser();
    const project = {
      id: store.nextId("p"),
      name: input.name,
      description: input.description ?? null,
      ownerId: user.id,
      inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: "ACTIVE" as const,
      createdAt: new Date().toISOString(),
      myRole: "OWNER" as const,
      memberCount: 1,
      taskStats: { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0 },
    };
    store.projects.push(project);
    store.memberships.push({
      projectId: project.id,
      userId: user.id,
      role: "OWNER",
      joinedAt: new Date().toISOString(),
    });
    return toProject(project, user.id);
  },

  async getProject(projectId: string): Promise<ProjectDetail> {
    const user = requireUser();
    assertProjectMember(projectId, user);
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("项目不存在");
    return {
      ...toProject(project, user.id),
      members: store.memberships
        .filter((m) => m.projectId === projectId)
        .map(toMember),
      labels: store.labels.filter((l) => l.projectId === projectId),
    };
  },

  async deleteProject(projectId: string): Promise<void> {
    const user = requireUser();
    const role = store.myRole(projectId, user.id);
    if (role !== "OWNER") throw new Error("仅项目所有者可以删除项目");
    store.projects = store.projects.filter((project) => project.id !== projectId);
    store.memberships = store.memberships.filter((item) => item.projectId !== projectId);
    store.labels = store.labels.filter((item) => item.projectId !== projectId);
    store.tasks = store.tasks.filter((task) => task.projectId !== projectId);
    store.activities = store.activities.filter((item) => item.projectId !== projectId);
  },

  async joinProject(input: JoinProjectInput): Promise<Project> {
    const user = requireUser();
    const project = store.projects.find(
      (p) => p.inviteCode.toUpperCase() === input.inviteCode.trim().toUpperCase()
    );
    if (!project) throw new Error("邀请码无效");
    if (!store.myRole(project.id, user.id)) {
      store.memberships.push({
        projectId: project.id,
        userId: user.id,
        role: "MEMBER",
        joinedAt: new Date().toISOString(),
      });
      store.addActivity({
        projectId: project.id,
        taskId: null,
        type: "MEMBER_JOINED",
        content: `加入了项目「${project.name}」`,
        userId: user.id,
      });
    }
    return toProject(project, user.id);
  },

  async listMembers(projectId: string): Promise<Member[]> {
    const user = requireUser();
    assertProjectMember(projectId, user);
    return store.memberships
      .filter((m) => m.projectId === projectId)
      .map(toMember);
  },

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: MemberRole
  ): Promise<void> {
    const user = requireUser();
    if (store.myRole(projectId, user.id) !== "OWNER")
      throw new Error("仅项目所有者可以修改成员角色");
    const membership = store.memberships.find(
      (m) => m.projectId === projectId && m.userId === userId
    );
    if (!membership) throw new Error("成员不存在");
    if (membership.role === "OWNER") throw new Error("不能修改所有者角色");
    membership.role = role;
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    const user = requireUser();
    const myRole = store.myRole(projectId, user.id);
    if (myRole !== "OWNER" && myRole !== "ADMIN")
      throw new Error("无权移除成员");
    const membership = store.memberships.find(
      (m) => m.projectId === projectId && m.userId === userId
    );
    if (!membership) throw new Error("成员不存在");
    if (membership.role === "OWNER") throw new Error("不能移除项目所有者");
    store.memberships.splice(store.memberships.indexOf(membership), 1);
  },

  // ---------- 任务 ----------
  async listTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
    const user = requireUser();
    assertProjectMember(projectId, user);
    const f = filters ?? {};
    return store.tasks
      .filter((t) => t.projectId === projectId)
      .filter((t) => (f.status ? t.status === f.status : true))
      .filter((t) => (f.priority ? t.priority === f.priority : true))
      .filter((t) => (f.assigneeId ? t.assigneeId === f.assigneeId : true))
      .filter((t) => (f.labelId ? t.labelIds.includes(f.labelId) : true))
      .filter((t) =>
        f.keyword ? t.title.toLowerCase().includes(f.keyword.toLowerCase()) : true
      )
      .sort((a, b) => a.position - b.position)
      .map(toTask);
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const user = requireUser();
    assertProjectMember(input.projectId, user);
    if (input.status && input.status !== "TODO") {
      throw new Error("新建任务只能从「待办」开始，请按 待办 → 进行中 → 已完成 依次流转");
    }
    const status = "TODO" as const;
    const maxPos = Math.max(
      0,
      ...store.tasks
        .filter((t) => t.projectId === input.projectId && t.status === status)
        .map((t) => t.position)
    );
    const task = {
      id: store.nextId("t"),
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status,
      priority: input.priority ?? "MEDIUM",
      dueDate: input.dueDate ?? null,
      assigneeId: input.assigneeId ?? null,
      creatorId: user.id,
      labelIds: input.labelIds ?? [],
      position: maxPos + 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tasks.push(task);
    store.addActivity({
      projectId: input.projectId,
      taskId: task.id,
      type: "TASK_CREATED",
      content: `创建了任务「${task.title}」`,
      userId: user.id,
    });
    return toTask(task);
  },

  async updateTask(taskId: string, patch: UpdateTaskInput): Promise<Task> {
    const user = requireUser();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    assertProjectMember(task.projectId, user);

    if (
      patch.status &&
      patch.status !== task.status &&
      !isAdjacentStatus(task.status, patch.status)
    ) {
      throw new Error(statusTransitionMessage(task.status, patch.status));
    }
    const statusChanged = patch.status && patch.status !== task.status;
    if (patch.title !== undefined) task.title = patch.title;
    if (patch.description !== undefined) task.description = patch.description;
    if (patch.priority !== undefined) task.priority = patch.priority;
    if (patch.dueDate !== undefined) task.dueDate = patch.dueDate;
    if (patch.assigneeId !== undefined) task.assigneeId = patch.assigneeId;
    if (patch.labelIds !== undefined) task.labelIds = patch.labelIds;
    if (patch.position !== undefined) task.position = patch.position;
    if (patch.status !== undefined) task.status = patch.status;
    if (statusChanged && patch.position === undefined) {
      const maxPos = Math.max(
        0,
        ...store.tasks
          .filter(
            (t) => t.projectId === task.projectId && t.status === task.status && t.id !== task.id
          )
          .map((t) => t.position)
      );
      task.position = maxPos + 1000;
    }
    task.updatedAt = new Date().toISOString();

    if (statusChanged) {
      store.addActivity({
        projectId: task.projectId,
        taskId: task.id,
        type: "STATUS_CHANGED",
        content: `将「${task.title}」移入「${
          { TODO: "待办", IN_PROGRESS: "进行中", DONE: "已完成" }[task.status]
        }」`,
        userId: user.id,
      });
    } else {
      store.addActivity({
        projectId: task.projectId,
        taskId: task.id,
        type: "TASK_UPDATED",
        content: `更新了任务「${task.title}」`,
        userId: user.id,
      });
    }
    return toTask(task);
  },

  async deleteTask(taskId: string): Promise<void> {
    const user = requireUser();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("任务不存在");
    assertProjectMember(task.projectId, user);
    store.tasks.splice(store.tasks.indexOf(task), 1);
    store.addActivity({
      projectId: task.projectId,
      taskId: null,
      type: "TASK_DELETED",
      content: `删除了任务「${task.title}」`,
      userId: user.id,
    });
  },

  // ---------- 评论 / 动态 / 标签 ----------
  async listComments(taskId: string): Promise<Comment[]> {
    requireUser();
    return store.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((c) => ({
        id: c.id,
        taskId: c.taskId,
        content: c.content,
        author: store.findUser(c.authorId) as User,
        createdAt: c.createdAt,
      }));
  },

  async addComment(input: CreateCommentInput): Promise<Comment> {
    const user = requireUser();
    const task = store.tasks.find((t) => t.id === input.taskId);
    if (!task) throw new Error("任务不存在");
    const comment = {
      id: store.nextId("c"),
      taskId: input.taskId,
      authorId: user.id,
      content: input.content,
      createdAt: new Date().toISOString(),
    };
    store.comments.push(comment);
    store.addActivity({
      projectId: task.projectId,
      taskId: task.id,
      type: "COMMENT_ADDED",
      content: `评论了「${task.title}」`,
      userId: user.id,
    });
    return {
      id: comment.id,
      taskId: comment.taskId,
      content: comment.content,
      author: user,
      createdAt: comment.createdAt,
    };
  },

  async listActivities(projectId: string): Promise<Activity[]> {
    const user = requireUser();
    assertProjectMember(projectId, user);
    return store.activities
      .filter((a) => a.projectId === projectId)
      .slice(0, 50)
      .map((a) => ({
        id: a.id,
        projectId: a.projectId,
        taskId: a.taskId,
        type: a.type,
        content: a.content,
        user: store.findUser(a.userId) as User,
        createdAt: a.createdAt,
      }));
  },

  async createLabel(input: CreateLabelInput): Promise<Label> {
    const user = requireUser();
    assertProjectMember(input.projectId, user);
    const label: Label = {
      id: store.nextId("l"),
      projectId: input.projectId,
      name: input.name,
      color: input.color,
    };
    store.labels.push(label);
    return label;
  },

  async listTeamProjects() {
    return [];
  },
  async joinTeamProject() {
    throw new Error("Mock 未实现团队项目加入");
  },
  async assignProjectTeam() {
    throw new Error("请切换到 http 模式归属项目");
  },
  async updateProjectStatus(projectId, status) {
    const user = requireUser();
    const project = store.projects.find((p) => p.id === projectId);
    if (!project) throw new Error("项目不存在");
    assertProjectMember(projectId, user);
    (project as { status?: string }).status = status;
    return toProject(project, user.id);
  },
  async getTeam() {
    return null;
  },
  async createTeam() {
    throw new Error("请切换到 http 模式使用团队功能");
  },
  async joinTeam() {
    throw new Error("请切换到 http 模式使用团队功能");
  },
  async leaveTeam() {},
  async listReports() {
    return [];
  },
  async createReport() {
    throw new Error("请切换到 http 模式使用报告功能");
  },
  async updateReport() {
    throw new Error("请切换到 http 模式使用报告功能");
  },
  async deleteReport() {},
  async getSettings() {
    const user = requireUser();
    return {
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      notifyDue: true,
      notifyComment: true,
      weekStart: 1,
      teamName: null,
    };
  },
  async updateSettings(input) {
    const current = await this.getSettings();
    return { ...current, ...input, username: input.username ?? current.username };
  },
};
