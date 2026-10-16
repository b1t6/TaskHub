"use client";

import { Card, Empty } from "antd";
import ReactECharts from "echarts-for-react";
import type { Project } from "@/types";

const STATUS_COLORS = {
  todo: "#94a3b8",
  inProgress: "#2563eb",
  done: "#16a34a",
  overdue: "#ef4444",
};

function buildStatusOption(projects: Project[]) {
  const todo = projects.reduce((sum, p) => sum + p.taskStats.todo, 0);
  const inProgress = projects.reduce((sum, p) => sum + p.taskStats.inProgress, 0);
  const done = projects.reduce((sum, p) => sum + p.taskStats.done, 0);
  const total = todo + inProgress + done;

  return {
    color: [STATUS_COLORS.todo, STATUS_COLORS.inProgress, STATUS_COLORS.done],
    tooltip: { trigger: "item", formatter: "{b}: {c}（{d}%）" },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: "#64748b", fontSize: 12 },
    },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        center: ["50%", "46%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 600 },
          scaleSize: 4,
        },
        data: [
          { name: "待办", value: todo },
          { name: "进行中", value: inProgress },
          { name: "已完成", value: done },
        ],
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "40%",
        style: {
          text: String(total),
          fill: "#0f172a",
          fontSize: 28,
          fontWeight: 700,
          textAlign: "center",
        },
      },
      {
        type: "text",
        left: "center",
        top: "52%",
        style: {
          text: "全部任务",
          fill: "#94a3b8",
          fontSize: 12,
          textAlign: "center",
        },
      },
    ],
  };
}

function buildProjectOption(projects: Project[]) {
  const names = projects.map((p) =>
    p.name.length > 8 ? `${p.name.slice(0, 8)}…` : p.name
  );

  return {
    color: [STATUS_COLORS.todo, STATUS_COLORS.inProgress, STATUS_COLORS.done],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      top: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: "#64748b", fontSize: 12 },
    },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: names,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { color: "#94a3b8" },
    },
    series: [
      {
        name: "待办",
        type: "bar",
        stack: "total",
        barMaxWidth: 36,
        emphasis: { focus: "series" },
        data: projects.map((p) => p.taskStats.todo),
      },
      {
        name: "进行中",
        type: "bar",
        stack: "total",
        barMaxWidth: 36,
        emphasis: { focus: "series" },
        data: projects.map((p) => p.taskStats.inProgress),
      },
      {
        name: "已完成",
        type: "bar",
        stack: "total",
        barMaxWidth: 36,
        emphasis: { focus: "series" },
        data: projects.map((p) => p.taskStats.done),
      },
    ],
  };
}

function buildOverdueOption(projects: Project[]) {
  const rows = projects
    .map((p) => ({ name: p.name, value: p.taskStats.overdue }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (rows.length === 0) {
    return null;
  }

  return {
    color: [STATUS_COLORS.overdue],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      minInterval: 1,
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: { color: "#94a3b8" },
    },
    yAxis: {
      type: "category",
      data: rows.map((row) =>
        row.name.length > 10 ? `${row.name.slice(0, 10)}…` : row.name
      ),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 18,
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        data: rows.map((row) => row.value),
      },
    ],
  };
}

export default function DashboardCharts({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  const hasTasks = projects.some((p) => p.taskStats.total > 0);
  const overdueOption = buildOverdueOption(projects);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card size="small" title="任务状态分布" className="lg:col-span-1">
        {hasTasks ? (
          <ReactECharts
            option={buildStatusOption(projects)}
            style={{ height: 280 }}
            opts={{ renderer: "canvas" }}
            notMerge
          />
        ) : (
          <div className="flex h-[280px] items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无任务数据" />
          </div>
        )}
      </Card>

      <Card size="small" title="各项目任务对比" className="lg:col-span-2">
        {hasTasks ? (
          <ReactECharts
            option={buildProjectOption(projects)}
            style={{ height: 280 }}
            opts={{ renderer: "canvas" }}
            notMerge
          />
        ) : (
          <div className="flex h-[280px] items-center justify-center">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="创建任务后将显示对比图" />
          </div>
        )}
      </Card>

      {overdueOption && (
        <Card size="small" title="逾期任务预警" className="lg:col-span-3">
          <ReactECharts
            option={overdueOption}
            style={{ height: 220 }}
            opts={{ renderer: "canvas" }}
            notMerge
          />
        </Card>
      )}
    </div>
  );
}
