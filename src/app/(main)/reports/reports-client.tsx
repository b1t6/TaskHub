"use client";

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Tabs,
  Tag,
  App as AntdApp,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import type { ReportItem } from "@/types";

export default function ReportsClient() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"personal" | "team">("personal");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReportItem | null>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.reports(scope),
    queryFn: () => api.listReports(scope),
  });
  const items = listQuery.data ?? [];
  const loading = listQuery.isLoading && !listQuery.data;

  const invalidateReports = () => {
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: { title: string; content: string }) => {
      if (editing) return api.updateReport(editing.id, values);
      return api.createReport(values);
    },
    onSuccess: () => {
      message.success(editing ? "报告已更新" : "报告已创建");
      setEditorOpen(false);
      invalidateReports();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "保存失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: (item: ReportItem) => api.deleteReport(item.id),
    onSuccess: () => {
      message.success("已删除");
      invalidateReports();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "删除失败"),
  });

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (item: ReportItem) => {
    if (!item.mine) {
      message.warning("只能修改自己的报告");
      return;
    }
    setEditing(item);
    setEditorOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">报告</h1>
          <p className="mt-1 text-sm text-gray-500">个人之记，可书可改；温故而知新。</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          写报告
        </Button>
      </div>

      <Tabs
        activeKey={scope}
        onChange={(key) => setScope(key as "personal" | "team")}
        items={[
          { key: "personal", label: "个人" },
          { key: "team", label: "团队" },
        ]}
      />

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : items.length === 0 ? (
        <Empty
          description={scope === "team" ? "团队暂无报告，或你尚未加入团队" : "还没有个人报告"}
          className="rounded-lg border border-dashed border-gray-200 bg-white py-12"
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              size="small"
              title={
                <div className="flex flex-wrap items-center gap-2">
                  <span>{item.title}</span>
                  {!item.mine && <Tag>只读</Tag>}
                  {item.mine && <Tag color="blue">我的</Tag>}
                </div>
              }
              extra={
                item.mine ? (
                  <div className="flex gap-2">
                    <Button size="small" onClick={() => openEdit(item)}>
                      编辑
                    </Button>
                    <Popconfirm title="确定删除？" onConfirm={() => deleteMutation.mutate(item)}>
                      <Button size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                ) : null
              }
            >
              <div className="mb-2 whitespace-pre-wrap text-sm text-gray-700">{item.content}</div>
              <div className="text-xs text-gray-400">
                {item.author.username} · 更新于 {formatDateTime(item.updatedAt)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title={editing ? "编辑报告" : "写报告"}
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          className="pt-2"
          initialValues={
            editing
              ? { title: editing.title, content: editing.content }
              : { title: "", content: "" }
          }
          onFinish={(values) => saveMutation.mutate(values)}
          key={editing?.id ?? "new"}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: "请输入内容" }]}
          >
            <Input.TextArea rows={8} placeholder="本周进展、风险与下周计划…" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={saveMutation.isPending}>
            保存
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
