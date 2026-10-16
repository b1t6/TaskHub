import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { ApiClient } from "./client";

// ============================================================
// API 客户端出口：前后端分离的切换点
// - NEXT_PUBLIC_API_MODE=mock → 内存 Mock 实现（前端独立开发/演示）
// - NEXT_PUBLIC_API_MODE=http → 真实后端 Route Handlers（/src/app/api/**）
// 业务代码只依赖本文件导出的 api，不感知具体实现
// ============================================================

export type { ApiClient } from "./client";
export { ApiError } from "./http";

export const api: ApiClient =
  process.env.NEXT_PUBLIC_API_MODE === "mock" ? mockApi : httpApi;
