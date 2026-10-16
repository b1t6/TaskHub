import { randomBytes, scryptSync } from "crypto";
import { PrismaClient, type ProjectStatus, type TaskPriority, type TaskStatus } from "@prisma/client";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

const DEMO_EMAILS = [
  "linxiao@taskhub.local",
  "zhouning@taskhub.local",
  "chenke@taskhub.local",
  "zhaomin@taskhub.local",
  "sunlei@taskhub.local",
  "hean@taskhub.local",
];

async function clearDemo() {
  const users = await db.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true },
  });
  if (users.length === 0) return;
  const ids = users.map((u) => u.id);
  await db.report.deleteMany({ where: { authorId: { in: ids } } });
  await db.project.deleteMany({ where: { ownerId: { in: ids } } });
  await db.projectMember.deleteMany({ where: { userId: { in: ids } } });
  await db.user.updateMany({ where: { id: { in: ids } }, data: { teamId: null } });
  await db.team.deleteMany({ where: { ownerId: { in: ids } } });
  await db.userSetting.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

async function main() {
  await clearDemo();
  const passwordHash = hashPassword("demo123456");

  const lin = await db.user.create({
    data: {
      email: "linxiao@taskhub.local",
      username: "林晓",
      passwordHash,
      setting: { create: { notifyDue: true, notifyComment: true, weekStart: 1 } },
    },
  });
  const zhou = await db.user.create({
    data: { email: "zhouning@taskhub.local", username: "周宁", passwordHash },
  });
  const chen = await db.user.create({
    data: { email: "chenke@taskhub.local", username: "陈可", passwordHash },
  });
  const zhao = await db.user.create({
    data: { email: "zhaomin@taskhub.local", username: "赵敏", passwordHash },
  });
  const sun = await db.user.create({
    data: { email: "sunlei@taskhub.local", username: "孙磊", passwordHash },
  });
  await db.user.create({
    data: {
      email: "hean@taskhub.local",
      username: "何安",
      passwordHash,
      setting: { create: { notifyDue: false, notifyComment: true, weekStart: 0 } },
    },
  });

  const polaris = await db.team.create({
    data: { name: "北极星产品组", code: "NORTH1", ownerId: lin.id },
  });
  const coast = await db.team.create({
    data: { name: "海岸设计组", code: "COAST8", ownerId: zhao.id },
  });

  await db.user.update({ where: { id: lin.id }, data: { teamId: polaris.id } });
  await db.user.update({ where: { id: zhou.id }, data: { teamId: polaris.id } });
  await db.user.update({ where: { id: chen.id }, data: { teamId: polaris.id } });
  await db.user.update({ where: { id: zhao.id }, data: { teamId: coast.id } });
  await db.user.update({ where: { id: sun.id }, data: { teamId: coast.id } });

  async function project(input: {
    name: string;
    description: string;
    ownerId: string;
    teamId: string | null;
    status: ProjectStatus;
    inviteCode: string;
    members: { userId: string; role: "OWNER" | "ADMIN" | "MEMBER" }[];
  }) {
    return db.project.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId: input.ownerId,
        teamId: input.teamId,
        status: input.status,
        inviteCode: input.inviteCode,
        members: { create: input.members },
      },
    });
  }

  const site = await project({
    name: "官网改版",
    description: "公司官网视觉、信息架构与首屏性能一并升级，目标是把询盘转化提高 20%。",
    ownerId: lin.id,
    teamId: polaris.id,
    status: "ACTIVE",
    inviteCode: "WEB88A",
    members: [
      { userId: lin.id, role: "OWNER" },
      { userId: zhou.id, role: "ADMIN" },
      { userId: chen.id, role: "MEMBER" },
    ],
  });
  const crm = await project({
    name: "客户成功体系",
    description: "梳理续约、健康度和季度业务回顾流程，暂停等待销售侧确认指标口径。",
    ownerId: zhou.id,
    teamId: polaris.id,
    status: "PAUSED",
    inviteCode: "CRM12B",
    members: [
      { userId: zhou.id, role: "OWNER" },
      { userId: lin.id, role: "MEMBER" },
    ],
  });
  const app = await project({
    name: "移动端 App 2.0",
    description: "新版本已上线，保留缺陷收尾与复盘记录。",
    ownerId: chen.id,
    teamId: polaris.id,
    status: "COMPLETED",
    inviteCode: "APP20C",
    members: [
      { userId: chen.id, role: "OWNER" },
      { userId: lin.id, role: "MEMBER" },
      { userId: zhou.id, role: "MEMBER" },
    ],
  });
  const brand = await project({
    name: "品牌视觉升级",
    description: "更新主视觉、图标和演示模板，服务下一季发布会。",
    ownerId: zhao.id,
    teamId: coast.id,
    status: "ACTIVE",
    inviteCode: "BRD33D",
    members: [
      { userId: zhao.id, role: "OWNER" },
      { userId: sun.id, role: "MEMBER" },
    ],
  });
  const launch = await project({
    name: "年度发布会",
    description: "发布会物料与现场流程已交付，归档备查。",
    ownerId: sun.id,
    teamId: coast.id,
    status: "COMPLETED",
    inviteCode: "LCH44E",
    members: [
      { userId: sun.id, role: "OWNER" },
      { userId: zhao.id, role: "ADMIN" },
    ],
  });
  await project({
    name: "个人知识库整理",
    description: "尚未归属团队的个人项目，仅所有者可见于「我的项目」。",
    ownerId: lin.id,
    teamId: null,
    status: "ACTIVE",
    inviteCode: "NOTE5F",
    members: [{ userId: lin.id, role: "OWNER" }],
  });

  const labels = await db.label.createMany({
    data: [
      { projectId: site.id, name: "设计", color: "#722ed1" },
      { projectId: site.id, name: "前端", color: "#1677ff" },
      { projectId: site.id, name: "内容", color: "#13c2c2" },
      { projectId: brand.id, name: "视觉", color: "#eb2f96" },
      { projectId: app.id, name: "客户端", color: "#fa8c16" },
    ],
  });
  void labels;
  const siteLabels = await db.label.findMany({ where: { projectId: site.id } });
  const design = siteLabels.find((l) => l.name === "设计")!;
  const front = siteLabels.find((l) => l.name === "前端")!;

  async function addTask(input: {
    projectId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDays: number | null;
    assigneeId: string | null;
    creatorId: string;
    position: number;
    labelIds?: string[];
  }) {
    return db.task.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDays === null ? null : daysFromNow(input.dueDays),
        assigneeId: input.assigneeId,
        creatorId: input.creatorId,
        position: input.position,
        labels: input.labelIds?.length
          ? { create: input.labelIds.map((labelId) => ({ labelId })) }
          : undefined,
      },
    });
  }

  const banner = await addTask({
    projectId: site.id,
    title: "首页主视觉三稿",
    description: "覆盖科技、温和、高对比三种方向，周五前给市场评审。",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDays: 2,
    assigneeId: zhou.id,
    creatorId: lin.id,
    position: 1000,
    labelIds: [design.id],
  });
  await addTask({
    projectId: site.id,
    title: "导航信息架构重排",
    description: "把解决方案从一级导航拆到行业页。",
    status: "TODO",
    priority: "MEDIUM",
    dueDays: 6,
    assigneeId: chen.id,
    creatorId: lin.id,
    position: 1000,
    labelIds: [front.id],
  });
  await addTask({
    projectId: site.id,
    title: "首屏性能压到 2 秒内",
    description: "图片改用响应式格式，延迟加载案例区。",
    status: "TODO",
    priority: "URGENT",
    dueDays: -2,
    assigneeId: chen.id,
    creatorId: zhou.id,
    position: 2000,
    labelIds: [front.id],
  });
  await addTask({
    projectId: site.id,
    title: "客户案例文案校对",
    status: "DONE",
    priority: "LOW",
    dueDays: -8,
    assigneeId: lin.id,
    creatorId: lin.id,
    position: 1000,
  });
  await addTask({
    projectId: site.id,
    title: "询盘表单字段精简",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueDays: 4,
    assigneeId: lin.id,
    creatorId: zhou.id,
    position: 2000,
  });

  await addTask({
    projectId: crm.id,
    title: "健康度指标口径对齐",
    description: "等待销售负责人确认活跃定义。",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDays: 10,
    assigneeId: zhou.id,
    creatorId: zhou.id,
    position: 1000,
  });
  await addTask({
    projectId: crm.id,
    title: "续约提醒邮件模板",
    status: "TODO",
    priority: "MEDIUM",
    dueDays: 14,
    assigneeId: lin.id,
    creatorId: zhou.id,
    position: 1000,
  });

  await addTask({
    projectId: app.id,
    title: "登录改版验收",
    status: "DONE",
    priority: "HIGH",
    dueDays: -20,
    assigneeId: chen.id,
    creatorId: chen.id,
    position: 1000,
  });
  await addTask({
    projectId: app.id,
    title: "推送到达率复盘",
    status: "DONE",
    priority: "MEDIUM",
    dueDays: -12,
    assigneeId: zhou.id,
    creatorId: chen.id,
    position: 2000,
  });
  await addTask({
    projectId: app.id,
    title: "崩溃日志归档",
    status: "DONE",
    priority: "LOW",
    dueDays: -6,
    assigneeId: lin.id,
    creatorId: chen.id,
    position: 3000,
  });

  await addTask({
    projectId: brand.id,
    title: "主色与辅助色板",
    description: "输出浅色/深色两套色板和使用边界。",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDays: 3,
    assigneeId: zhao.id,
    creatorId: zhao.id,
    position: 1000,
  });
  await addTask({
    projectId: brand.id,
    title: "图标库第一批 24 枚",
    status: "TODO",
    priority: "MEDIUM",
    dueDays: 9,
    assigneeId: sun.id,
    creatorId: zhao.id,
    position: 1000,
  });
  await addTask({
    projectId: brand.id,
    title: "演示模板封面",
    status: "DONE",
    priority: "LOW",
    dueDays: -4,
    assigneeId: sun.id,
    creatorId: zhao.id,
    position: 1000,
  });

  await addTask({
    projectId: launch.id,
    title: "主视觉 KV",
    status: "DONE",
    priority: "URGENT",
    dueDays: -30,
    assigneeId: zhao.id,
    creatorId: sun.id,
    position: 1000,
  });
  await addTask({
    projectId: launch.id,
    title: "现场流程表",
    status: "DONE",
    priority: "HIGH",
    dueDays: -18,
    assigneeId: sun.id,
    creatorId: sun.id,
    position: 2000,
  });

  await db.comment.create({
    data: {
      taskId: banner.id,
      authorId: lin.id,
      content: "第二稿的留白更好，标题可以再短一点。",
    },
  });
  await db.comment.create({
    data: {
      taskId: banner.id,
      authorId: zhou.id,
      content: "已按评审意见收了一版，今晚上传标注。",
    },
  });

  const activity = async (
    projectId: string,
    userId: string,
    type: string,
    content: string,
    taskId?: string
  ) => {
    await db.activityLog.create({
      data: { projectId, userId, type, content, taskId: taskId ?? null, createdAt: daysFromNow(-1) },
    });
  };
  await activity(site.id, lin.id, "PROJECT_CREATED", "创建了项目「官网改版」");
  await activity(site.id, zhou.id, "STATUS_CHANGED", "将「首页主视觉三稿」移入「进行中」", banner.id);
  await activity(brand.id, zhao.id, "PROJECT_CREATED", "创建了项目「品牌视觉升级」");
  await activity(app.id, chen.id, "STATUS_CHANGED", "将「登录改版验收」移入「已完成」");

  await db.report.createMany({
    data: [
      {
        authorId: lin.id,
        title: "第 41 周产品周报",
        content:
          "官网改版完成信息架构初稿，首屏性能仍有两处图片未压缩。下周重点是询盘表单和案例页。风险：市场评审可能推迟到下周三。",
        createdAt: daysFromNow(-2),
      },
      {
        authorId: zhou.id,
        title: "设计进展",
        content: "主视觉三稿已出两稿，高对比方案转化预期更好，但和现有品牌手册有冲突，需要赵敏组给一个参考边界。",
        createdAt: daysFromNow(-1),
      },
      {
        authorId: chen.id,
        title: "App 2.0 收尾",
        content: "崩溃率回落到 0.4%。剩余事项都已关闭，建议项目状态保持已完成。",
        createdAt: daysFromNow(-5),
      },
      {
        authorId: zhao.id,
        title: "视觉升级周记",
        content: "色板初稿通过内部评审。图标库按「线性 1.5px」统一，第一批预计下周二交齐。",
        createdAt: daysFromNow(-1),
      },
      {
        authorId: sun.id,
        title: "发布会复盘",
        content: "现场流程准时，物料无缺件。建议把流程表模板沉淀到团队知识库。",
        createdAt: daysFromNow(-10),
      },
    ],
  });

  console.log("演示数据已写入。");
  console.log("账号密码均为 demo123456");
  console.log("林晓 linxiao@taskhub.local  团队北极星产品组（可归属项目）");
  console.log("周宁 zhouning@taskhub.local");
  console.log("陈可 chenke@taskhub.local");
  console.log("赵敏 zhaomin@taskhub.local  团队海岸设计组");
  console.log("孙磊 sunlei@taskhub.local");
  console.log("何安 hean@taskhub.local    未加入团队，仍可在项目组查看进度");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
