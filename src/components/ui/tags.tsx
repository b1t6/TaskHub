"use client";

import { Tag } from "antd";
import type { TaskPriority, TaskStatus } from "@/types";

// 状态/优先级展示元信息（颜色与文案集中管理）
export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  TODO: { label: "待办", color: "default" },
  IN_PROGRESS: { label: "进行中", color: "processing" },
  DONE: { label: "已完成", color: "success" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: "低", color: "default" },
  MEDIUM: { label: "中", color: "blue" },
  HIGH: { label: "高", color: "orange" },
  URGENT: { label: "紧急", color: "red" },
};

export function StatusTag({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

export function PriorityTag({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY_META[priority];
  return <Tag color={meta.color}>{meta.label}</Tag>;
}
