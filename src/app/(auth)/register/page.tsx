"use client";

import { Button, Card, Form, Input, App as AntdApp } from "antd";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirm: string;
}

export default function RegisterPage() {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await api.register({
        email: values.email,
        username: values.username,
        password: values.password,
      });
      message.success("注册成功");
      window.location.assign("/dashboard");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-96 shadow-md" title="注册 · 任务协作平台">
        <Form<RegisterForm> layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input placeholder="you@example.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 位" },
            ]}
          >
            <Input.Password placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请再次输入密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue("password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="确认密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              注册
            </Button>
          </Form.Item>
          <div className="text-center text-sm text-gray-500">
            已有账号？<Link href="/login">直接登录</Link>
          </div>
        </Form>
      </Card>
    </main>
  );
}
