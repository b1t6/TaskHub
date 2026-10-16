"use client";

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Tabs,
  Tag,
  App as AntdApp,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { ReportItem } from "@/types";

export default function ReportsPage() {
  const { message } = AntdApp.useApp();
  const [scope, setScope] = useState<"personal" | "team">("personal");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReportItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.listReports(scope));
    } catch (e) {
      message.error(e instanceof Error ? e.message : "加载失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope, message]);

  useEffect(() => {
    load();
  }, [load]);

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

  const save = async (values: { title: string; content: string }) => {
    setBusy(true);
    try {
      if (editing) {
        await api.updateReport(editing.id, values);
        message.success("报告已更新");
      } else {
        await api.createReport(values);
        message.success("报告已创建");
      }
      setEditorOpen(false);
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: ReportItem) => {
    try {
      await api.deleteReport(item.id);
      message.success("已删除");
      load();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">报告</h1>
          <p className="mt-1 text-sm text-gray-500">
            个人之记，可书可改；温故而知新。
          </p>
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

      {loading ? null : items.length === 0 ? (
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
                    <Popconfirm title="确定删除？" onConfirm={() => remove(item)}>
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
          onFinish={save}
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
          <Button type="primary" htmlType="submit" block loading={busy}>
            保存
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
