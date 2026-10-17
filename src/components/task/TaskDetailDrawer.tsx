"use client";

import {
  Avatar,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  App as AntdApp,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { avatarColor, formatDateTime } from "@/lib/utils";
import { PRIORITY_META, STATUS_META, StatusTag } from "@/components/ui/tags";
import {
  allowedNextStatuses,
  isAdjacentStatus,
  statusTransitionMessage,
} from "@/lib/task-status";
import type { ProjectDetail, Task, TaskPriority, TaskStatus } from "@/types";

interface TaskEditValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Dayjs | null;
  assigneeId?: string;
  labelIds?: string[];
}

// 任务详情抽屉：查看/编辑任务 + 评论
export default function TaskDetailDrawer({
  open,
  onClose,
  task,
  project,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  project: ProjectDetail | null;
  onChanged: () => void;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<TaskEditValues>();
  const [commentText, setCommentText] = useState("");

  const commentsQuery = useQuery({
    queryKey: queryKeys.comments(task?.id ?? ""),
    queryFn: () => api.listComments(task!.id),
    enabled: open && Boolean(task?.id),
  });
  const comments = commentsQuery.data ?? [];

  useEffect(() => {
    if (open && task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description ?? undefined,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        assigneeId: task.assignee?.id,
        labelIds: task.labels.map((l) => l.id),
      });
      setCommentText("");
    }
  }, [open, task, form]);

  const saveMutation = useMutation({
    mutationFn: (values: TaskEditValues) =>
      api.updateTask(task!.id, {
        title: values.title,
        description: values.description ?? null,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assigneeId: values.assigneeId ?? null,
        labelIds: values.labelIds ?? [],
      }),
    onSuccess: () => {
      message.success("已保存");
      onChanged();
      onClose();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "保存失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteTask(task!.id),
    onSuccess: () => {
      message.success("任务已删除");
      onChanged();
      onClose();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "删除失败"),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.addComment({ taskId: task!.id, content }),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(task!.id) });
      onChanged();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "评论失败"),
  });

  const handleSave = async () => {
    if (!task) return;
    const values = await form.validateFields();
    if (!isAdjacentStatus(task.status, values.status)) {
      message.warning(statusTransitionMessage(task.status, values.status));
      return;
    }
    saveMutation.mutate(values);
  };

  const handleSendComment = () => {
    const content = commentText.trim();
    if (!task || !content) return;
    commentMutation.mutate(content);
  };

  return (
    <Drawer
      title={task ? "任务详情" : ""}
      open={open}
      onClose={onClose}
      width={520}
      destroyOnHidden
      footer={
        task && (
          <div className="flex justify-between">
            <Popconfirm title="确定删除该任务？" onConfirm={() => deleteMutation.mutate()}>
              <Button danger loading={deleteMutation.isPending}>
                删除任务
              </Button>
            </Popconfirm>
            <Button type="primary" loading={saveMutation.isPending} onClick={handleSave}>
              保存修改
            </Button>
          </div>
        )
      }
    >
      {task && (
        <>
          <Form<TaskEditValues> form={form} layout="vertical">
            <Form.Item name="title" rules={[{ required: true, message: "标题不能为空" }]}>
              <Input className="!text-base !font-medium" maxLength={200} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="补充说明" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item
                name="status"
                label="状态"
                extra="仅可按 待办 → 进行中 → 已完成 相邻流转"
              >
                <Select
                  options={allowedNextStatuses(task.status).map((s) => ({
                    value: s,
                    label: STATUS_META[s].label,
                  }))}
                />
              </Form.Item>
              <Form.Item name="priority" label="优先级">
                <Select
                  options={(Object.keys(PRIORITY_META) as TaskPriority[]).map((p) => ({
                    value: p,
                    label: PRIORITY_META[p].label,
                  }))}
                />
              </Form.Item>
              <Form.Item name="dueDate" label="截止日期">
                <DatePicker
                  className="w-full"
                  disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
                />
              </Form.Item>
              <Form.Item name="assigneeId" label="负责人">
                <Select
                  allowClear
                  placeholder="未分配"
                  options={(project?.members ?? []).map((m) => ({
                    value: m.id,
                    label: m.username,
                  }))}
                />
              </Form.Item>
            </div>
            <Form.Item name="labelIds" label="标签">
              <Select
                mode="multiple"
                allowClear
                placeholder="选择标签"
                options={(project?.labels ?? []).map((l) => ({ value: l.id, label: l.name }))}
              />
            </Form.Item>
          </Form>

          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">评论 ({comments.length})</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              当前状态 <StatusTag status={form.getFieldValue("status") ?? task.status} />
            </span>
          </div>
          <div className="mb-2 max-h-64 space-y-3 overflow-y-auto rounded-md bg-gray-50 p-3">
            {comments.length === 0 && (
              <div className="text-center text-sm text-gray-400">暂无评论</div>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar size={28} style={{ backgroundColor: avatarColor(c.author.id), fontSize: 13 }}>
                  {c.author.username.slice(0, 1)}
                </Avatar>
                <div>
                  <div className="text-xs text-gray-400">
                    {c.author.username} · {formatDateTime(c.createdAt)}
                  </div>
                  <div className="text-sm">{c.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={handleSendComment}
              placeholder="写下评论，回车发送"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendComment}
              loading={commentMutation.isPending}
              disabled={!commentText.trim()}
            />
          </div>
        </>
      )}
    </Drawer>
  );
}
