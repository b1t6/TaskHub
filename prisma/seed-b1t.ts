import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const team = await db.team.findFirst({
    where: { OR: [{ code: "NORTH1" }, { name: "北极星产品组" }] },
  });
  if (!team) throw new Error("北极星产品组不存在，请先执行 npm run db:seed");

  const email = "b1t@taskhub.local";
  const username = "b1t";
  const passwordHash = hashPassword("demo123456");

  let user = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: { username, email, passwordHash, teamId: team.id },
    });
    await db.userSetting.upsert({
      where: { userId: user.id },
      create: { userId: user.id, notifyDue: true, notifyComment: true, weekStart: 1 },
      update: {},
    });
    console.log("已更新已有账号 b1t");
  } else {
    user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        teamId: team.id,
        setting: { create: { notifyDue: true, notifyComment: true, weekStart: 1 } },
      },
    });
    console.log("已创建账号 b1t");
  }

  const projects = await db.project.findMany({ where: { teamId: team.id } });
  for (const project of projects) {
    await db.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      create: { projectId: project.id, userId: user.id, role: "MEMBER" },
      update: {},
    });
  }

  console.log(`团队：${team.name}（邀请码 ${team.code}）`);
  console.log(`已加入该组项目数：${projects.length}`);
  console.log("登录邮箱：b1t@taskhub.local");
  console.log("登录密码：demo123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
