"use client";

import { Card, Progress, Statistic } from "antd";
import { FireOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import type { ProjectStats } from "@/types";

export type StatKey = "all" | "TODO" | "IN_PROGRESS" | "DONE" | "overdue";

const ITEMS: {
  key: StatKey;
  title: ReactNode;
  value: (stats: ProjectStats) => number;
  color?: string;
}[] = [
  { key: "all", title: "全部任务", value: (s) => s.total },
  { key: "TODO", title: "待办", value: (s) => s.todo },
  {
    key: "IN_PROGRESS",
    title: "进行中",
    value: (s) => s.inProgress,
    color: "#1677ff",
  },
  {
    key: "DONE",
    title: "已完成",
    value: (s) => s.done,
    color: "#16a34a",
  },
  {
    key: "overdue",
    title: (
      <span>
        <FireOutlined className="text-red-500" /> 已逾期
      </span>
    ),
    value: (s) => s.overdue,
    color: "#f5222d",
  },
];

export const STAT_TITLES: Record<StatKey, string> = {
  all: "全部任务",
  TODO: "待办任务",
  IN_PROGRESS: "进行中任务",
  DONE: "已完成任务",
  overdue: "已逾期任务",
};

/** 可点击的项目统计卡片：选择后过滤任务列表 */
export default function ProjectStatFilter({
  stats,
  percent,
  active,
  onChange,
}: {
  stats: ProjectStats;
  percent: number;
  active: StatKey;
  onChange: (key: StatKey) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-4">
      <Card size="small" className="w-44 shrink-0">
        <div className="flex items-center gap-3">
          <Progress
            type="circle"
            size={44}
            percent={percent}
            status={percent === 100 ? "success" : "normal"}
          />
          <Statistic title="完成进度" value={percent} suffix="%" />
        </div>
      </Card>

      <Card size="small" className="min-w-0 flex-1">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {ITEMS.map((item) => {
            const selected = active === item.key;
            const value = item.value(stats);
            const valueColor =
              item.key === "overdue"
                ? value
                  ? item.color
                  : undefined
                : item.color;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`rounded-lg px-3 py-2 text-left transition ${
                  selected
                    ? "bg-blue-50 ring-2 ring-blue-400"
                    : "hover:bg-gray-50"
                }`}
              >
                <Statistic
                  title={item.title}
                  value={value}
                  valueStyle={{
                    color: selected ? "#1677ff" : valueColor,
                    fontSize: 24,
                  }}
                />
                <div className="mt-1 text-xs text-gray-400">
                  {selected ? "当前列表" : "点击查看列表"}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
