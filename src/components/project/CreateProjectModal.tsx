"use client";

import { Form, Input, Modal, App as AntdApp } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";

interface CreateProjectForm {
  name: string;
  description?: string;
}

// 新建项目弹窗
export default function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CreateProjectForm>();
  const [loading, setLoading] = useState(false);

  const createProject = useMutation({
    mutationFn: (values: CreateProjectForm) => api.createProject(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.teamProjects });
      form.resetFields();
      onCreated();
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "创建失败"),
  });

  const handleOk = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await createProject.mutateAsync(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建项目"
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
      <Form<CreateProjectForm> form={form} layout="vertical" className="pt-2">
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: "请输入项目名称" }]}
        >
          <Input placeholder="例如：官网改版" maxLength={100} />
        </Form.Item>
        <Form.Item name="description" label="项目描述">
          <Input.TextArea placeholder="简单描述一下这个项目（可选）" rows={3} maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
