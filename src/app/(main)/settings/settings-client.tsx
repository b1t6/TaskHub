"use client";

import { Button, Card, Form, Input, Select, Switch, Upload, Avatar, Image, App as AntdApp } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fileToAvatar } from "@/lib/avatar";
import { queryKeys } from "@/lib/queries";
import { avatarColor } from "@/lib/utils";
import type { UserSettings } from "@/types";

export default function SettingsClient() {
  const { message } = AntdApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UserSettings>();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.getSettings(),
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    form.setFieldsValue(settingsQuery.data);
    setAvatarUrl(settingsQuery.data.avatarUrl ?? null);
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

  const avatarMutation = useMutation({
    mutationFn: (next: string | null) => api.updateSettings({ avatarUrl: next }),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings, saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setAvatarUrl(saved.avatarUrl ?? null);
      message.success(saved.avatarUrl ? "头像已更新" : "头像已移除");
    },
    onError: (e) => message.error(e instanceof Error ? e.message : "头像保存失败"),
  });

  const onPickAvatar = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await fileToAvatar(file);
      setAvatarUrl(dataUrl);
      await avatarMutation.mutateAsync(dataUrl);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "头像处理失败");
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">设置</h1>
        <p className="mt-1 text-sm text-gray-500">修己以敬，事乃有序。</p>
      </div>

      <Card loading={settingsQuery.isLoading && !settingsQuery.data}>
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <div className="mb-4 text-sm font-medium text-gray-700">个人资料</div>
          <div className="mb-6 flex items-center gap-5">
            {avatarUrl ? (
              <div className="shrink-0 overflow-hidden rounded-full [&_.ant-image-mask]:rounded-full">
                <Image
                  src={avatarUrl}
                  alt="头像预览"
                  width={72}
                  height={72}
                  preview={{ mask: "预览" }}
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <Avatar
                size={72}
                style={{ backgroundColor: avatarColor(settingsQuery.data?.username ?? "user") }}
              >
                {(settingsQuery.data?.username ?? "用").slice(0, 1)}
              </Avatar>
            )}
            <div className="flex items-center gap-2">
              <Upload accept="image/*" showUploadList={false} beforeUpload={onPickAvatar}>
                <Button icon={<UploadOutlined />} loading={uploading || avatarMutation.isPending}>
                  上传头像
                </Button>
              </Upload>
              {avatarUrl ? (
                <Button danger onClick={() => avatarMutation.mutate(null)}>
                  移除头像
                </Button>
              ) : null}
            </div>
          </div>
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
