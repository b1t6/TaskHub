"use client";

import { Avatar, Card, Empty, Spin, Tag } from "antd";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import { avatarColor, isOverdue } from "@/lib/utils";
import { PriorityTag, StatusTag } from "@/components/ui/tags";
import type { Task } from "@/types";

/** 统计卡片点开后的任务列表，点击一行打开详情 */
export default function TaskQuickList({
  tasks,
  loading,
  title,
  onOpenTask,
  footer,
}: {
  tasks: Task[];
  loading: boolean;
  title: string;
  onOpenTask: (task: Task) => void;
  footer?: ReactNode;
}) {
  return (
    <Card
      size="small"
      title={title}
      extra={<span className="text-xs text-gray-400">{tasks.length} 项</span>}
      styles={{ body: { padding: 0 } }}
    >
      {loading ? (
        <div className="py-10 text-center">
          <Spin />
        </div>
      ) : tasks.length === 0 ? (
        <Empty
          className="py-8"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="该分类下暂无任务"
        />
      ) : (
        <ul className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
              onClick={() => onOpenTask(task)}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-gray-800">{task.title}</span>
                  <StatusTag status={task.status} />
                  <PriorityTag priority={task.priority} />
                  {isOverdue(task) && <Tag color="error">逾期</Tag>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span>
                    {task.assignee ? (
                      <span className="inline-flex items-center gap-1">
                        <Avatar
                          size={16}
                          style={{ backgroundColor: avatarColor(task.assignee.id), fontSize: 10 }}
                        >
                          {task.assignee.username.slice(0, 1)}
                        </Avatar>
                        {task.assignee.username}
                      </span>
                    ) : (
                      "未分配"
                    )}
                  </span>
                  <span>
                    截止 {task.dueDate ? dayjs(task.dueDate).format("YYYY-MM-DD") : "未设置"}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </Card>
  );
}
