# 部署到 Vercel + TiDB Cloud

## 1. 创建免费 TiDB 集群

1. 打开 [TiDB Cloud](https://tidbcloud.com) 注册 / 登录  
2. 创建 **Starter（Serverless）** 集群（免费档）  
3. 记下 root 密码（只显示一次）  
4. 进入集群 → **Connect**  
5. 连接方式选 **Prisma**，复制 `DATABASE_URL`  
   - 形如：`mysql://xxx:yyy@gateway....tidbcloud.com:4000/test?sslaccept=strict`  
6. 建议在控制台把库名改成 / 新建为 `taskboard`（或连接后执行 `CREATE DATABASE taskboard;`）

## 2. 本地写入环境变量

编辑项目根目录 `.env`：

```env
DATABASE_URL="粘贴你的 TiDB 连接串"
AUTH_SECRET="足够长的随机串"
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=/api
```

然后同步表结构：

```bash
npx prisma db push
```

（可选）导入演示数据：`npx prisma db seed`（若已配置 seed）。

本地验证：

```bash
npm run dev
```

## 3. 部署到 Vercel

### 方式 A：Marketplace 集成（推荐）

1. 代码推到 GitHub  
2. [Vercel](https://vercel.com) 导入仓库  
3. 在 Vercel Marketplace 安装 [TiDB Cloud](https://vercel.com/marketplace/tidb-cloud)  
4. 绑定刚创建的集群，自动写入 `DATABASE_URL`  
5. 再手动添加环境变量：  
   - `AUTH_SECRET`  
   - `NEXT_PUBLIC_API_MODE=http`  
   - `NEXT_PUBLIC_API_BASE_URL=/api`  
6. Deploy  

### 方式 B：手动环境变量

在 Vercel Project → Settings → Environment Variables 添加与本地相同的变量，然后 Redeploy。

上线后在 Vercel 的 Build 日志确认 `prisma generate`（postinstall）成功。表结构请在本地或 CI 对 TiDB 执行过 `prisma db push` / `prisma migrate deploy`。

## 4. 说明

| 场景 | 连接方式 |
|------|----------|
| 运行时查询（本地连 TiDB / Vercel） | `@tidbcloud/prisma-adapter`（HTTPS） |
| `prisma db push` / migrate | 传统 TCP（同一条带 `:4000` 与 `sslaccept=strict` 的 URL） |
| 本地 MySQL（3306） | 普通 Prisma TCP，不启用 adapter |

项目里 `src/lib/db.ts` 会根据 `DATABASE_URL` 主机名 / 端口自动选择。
