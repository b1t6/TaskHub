import type { TaskStatus } from "@/types";

/** 任务状态只能按相邻步骤流转：待办 ↔ 进行中 ↔ 已完成 */
const ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

const LABELS: Record<TaskStatus, string> = {
  TODO: "待办",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
};

export function statusRank(status: TaskStatus): number {
  return ORDER.indexOf(status);
}

export function isAdjacentStatus(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return Math.abs(statusRank(from) - statusRank(to)) === 1;
}

export function allowedNextStatuses(current: TaskStatus): TaskStatus[] {
  return ORDER.filter((status) => isAdjacentStatus(current, status));
}

export function statusTransitionMessage(from: TaskStatus, to: TaskStatus): string {
  return `状态须依次流转（待办 → 进行中 → 已完成），不能从「${LABELS[from]}」直接改为「${LABELS[to]}」`;
}

/** 向前推进一格：待办→进行中→已完成；已完成无下一步 */
export function nextForwardStatus(current: TaskStatus): TaskStatus | null {
  const idx = statusRank(current);
  if (idx < 0 || idx >= ORDER.length - 1) return null;
  return ORDER[idx + 1];
}

export function forwardActionLabel(current: TaskStatus): string | null {
  if (current === "TODO") return "开始处理";
  if (current === "IN_PROGRESS") return "标记完成";
  return null;
}

export function statusLabel(status: TaskStatus): string {
  return LABELS[status];
}
