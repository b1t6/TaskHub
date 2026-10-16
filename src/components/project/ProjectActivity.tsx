"use client";

import { Collapse, Empty, Input, Select, Timeline } from "antd";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import type { Activity } from "@/types";

const CATEGORIES = [
  { value: "all", label: "全部分类" },
  { value: "status", label: "状态" },
  { value: "assignee", label: "负责人" },
  { value: "task", label: "任务" },
  { value: "comment", label: "评论" },
  { value: "member", label: "成员" },
  { value: "project", label: "项目" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

const CATEGORY_TYPES: Record<Exclude<Category, "all">, string[]> = {
  status: ["STATUS_CHANGED"],
  assignee: ["ASSIGNEE_CHANGED"],
  task: ["TASK_CREATED", "TASK_UPDATED", "TASK_DELETED"],
  comment: ["COMMENT_ADDED"],
  member: ["MEMBER_JOINED"],
  project: ["PROJECT_CREATED", "TEAM_ASSIGNED"],
};

function matchesCategory(type: string, category: Category) {
  if (category === "all") return true;
  return CATEGORY_TYPES[category].includes(type);
}

export default function ProjectActivity({ activities }: { activities: Activity[] }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return activities.filter((activity) => {
      if (!matchesCategory(activity.type, category)) return false;
      if (!query) return true;
      const text = `${activity.user.username} ${activity.content}`.toLowerCase();
      return text.includes(query);
    });
  }, [activities, keyword, category]);

  return (
    <Collapse
      className="border-t border-gray-100"
      bordered={false}
      items={[
        {
          key: "activity",
          label: (
            <span className="text-sm font-medium text-gray-700">
              项目动态
              <span className="ml-2 font-normal text-gray-400">{activities.length}</span>
            </span>
          ),
          children: (
            <div>
              <div className="mb-3 flex gap-2">
                <Input.Search
                  allowClear
                  placeholder="搜索成员或内容"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <Select
                  className="w-28 shrink-0"
                  value={category}
                  options={[...CATEGORIES]}
                  onChange={setCategory}
                />
              </div>
              {filtered.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的动态" />
              ) : (
                <Timeline
                  items={filtered.map((activity) => ({
                    color: activity.type === "STATUS_CHANGED" ? "blue" : "gray",
                    children: (
                      <div>
                        <div className="text-sm">
                          <span className="font-medium">{activity.user.username}</span>{" "}
                          {activity.content}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDateTime(activity.createdAt)}
                        </div>
                      </div>
                    ),
                  }))}
                />
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
