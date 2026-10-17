import dayjs from "dayjs";

// 通用前端工具函数

export function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  return dayjs(value).format("YYYY-MM-DD HH:mm");
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  return dayjs(value).format("YYYY-MM-DD");
}

// 是否已逾期：有截止日期、未完成、且已过当前时间
export function isOverdue(task: {
  dueDate?: string | null;
  status: string;
}): boolean {
  return Boolean(task.dueDate) && task.status !== "DONE" && task.dueDate! < new Date().toISOString();
}

// 根据字符串稳定生成头像背景色
const AVATAR_COLORS = ["#1677ff", "#722ed1", "#13c2c2", "#fa8c16", "#eb2f96", "#52c41a"];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
