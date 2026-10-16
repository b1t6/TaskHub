"use client";

import { Button, Card, Form, Input, Select, Switch, App as AntdApp } from "antd";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UserSettings } from "@/types";

export default function SettingsPage() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<UserSettings>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => form.setFieldsValue(settings))
      .catch((e) => message.error(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [form, message]);

  const onFinish = async (values: UserSettings) => {
    setSaving(true);
    try {
      const saved = await api.updateSettings({
        username: values.username,
        notifyDue: values.notifyDue,
        notifyComment: values.notifyComment,
        weekStart: values.weekStart,
      });
      form.setFieldsValue(saved);
      message.success("设置已保存");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-gray-500">修己以敬，事乃有序。</p>
      </div>

      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
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

          <Button type="primary" htmlType="submit" loading={saving}>
            保存设置
          </Button>
        </Form>
      </Card>
    </div>
  );
}
