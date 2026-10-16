"use client";

import { DatePicker, Form, Input, Modal, Select, App as AntdApp } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { api } from "@/lib/api";
import { PRIORITY_META, STATUS_META } from "@/components/ui/tags";
import type { CreateTaskInput, ProjectDetail, TaskPriority } from "@/types";

interface TaskFormValues {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: Dayjs | null;
  assigneeId?: string;
  labelIds?: string[];
}

// 创建任务弹窗：新建任务固定从「待办」开始
export default function TaskFormModal({
  open,
  onClose,
  project,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onCreated: () => void;
}) {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<TaskFormValues>();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const input: CreateTaskInput = {
        projectId: project.id,
        title: values.title,
        description: values.description,
        status: "TODO",
        priority: values.priority,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assigneeId: values.assigneeId ?? null,
        labelIds: values.labelIds ?? [],
      };
      await api.createTask(input);
      message.success("任务已创建（状态：待办）");
      form.resetFields();
      onCreated();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建任务"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      confirmLoading={loading}
      okText="创建"
      cancelText="取消"
      destroyOnHidden
    >
      <Form<TaskFormValues>
        form={form}
        layout="vertical"
        className="pt-2"
        initialValues={{ priority: "MEDIUM" }}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: "请输入任务标题" }]}
        >
          <Input placeholder="任务标题" maxLength={200} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="补充说明（可选）" rows={3} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label="状态" extra="须依次流转至进行中、已完成">
            <Input value={STATUS_META.TODO.label} disabled />
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
              placeholder="选择日期（可选）"
              disabledDate={(d) => d.isBefore(dayjs().startOf("day"))}
            />
          </Form.Item>
          <Form.Item name="assigneeId" label="负责人">
            <Select
              allowClear
              placeholder="选择负责人（可选）"
              options={project.members.map((m) => ({ value: m.id, label: m.username }))}
            />
          </Form.Item>
        </div>
        <Form.Item name="labelIds" label="标签">
          <Select
            mode="multiple"
            allowClear
            placeholder="选择标签（可选）"
            options={project.labels.map((l) => ({ value: l.id, label: l.name }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
