"use client";

import { Button, Card, Form, Input, Select, Switch, App as AntdApp } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import type { UserSettings } from "@/types";

export default function SettingsClient() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UserSettings>();

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (settingsQuery.data) form.setFieldsValue(settingsQuery.data);
  }, [settingsQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: UserSettings) =>
      api.updateSettings({
        username: values.username,
        notifyDue: values.notifyDue,
        notifyComment: values.notifyComment,
        weekStart: values.weekStart,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings, saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      form.setFieldsValue(saved);
      message.success("设置已保存");
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "保存失败"),
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-gray-500">修己以敬，事乃有序。</p>
      </div>

      <Card loading={settingsQuery.isLoading && !settingsQuery.data}>
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item
            name="username"
            label="显示名称"
            rules={[{ required: true, min: 2, message: "至少 2 个字符" }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="email" label="登录邮箱">
            <Input disabled />
          </Form.Item>
          <Form.Item name="teamName" label="当前团队">
            <Input disabled placeholder="尚未加入团队" />
          </Form.Item>

          <div className="mb-4 border-t border-gray-100 pt-4 text-sm font-medium text-gray-700">
            通知偏好
          </div>
          <Form.Item name="notifyDue" label="截止日期提醒" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item name="notifyComment" label="任务评论提醒" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>

          <div className="mb-4 border-t border-gray-100 pt-4 text-sm font-medium text-gray-700">
            工作视图
          </div>
          <Form.Item name="weekStart" label="一周起始日">
            <Select
              options={[
                { value: 1, label: "周一" },
                { value: 0, label: "周日" },
              ]}
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            保存设置
          </Button>
        </Form>
      </Card>
    </div>
  );
}
