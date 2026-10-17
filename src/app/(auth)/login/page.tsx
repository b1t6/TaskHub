"use client";

import { Button, Card, Form, Input, App as AntdApp } from "antd";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { postForm } from "@/lib/post-form";

interface LoginForm {
  email: string;
  password: string;
}

const DEMO = {
  email: "b1t@taskhub.local",
  password: "demo123456",
};

export default function LoginPage() {
  const { message } = AntdApp.useApp();
  const pageRef = useRef<HTMLElement>(null);
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"intro" | "to-login" | "login" | "to-intro">("intro");

  useEffect(() => {
    if (phase !== "to-login" && phase !== "to-intro") return;
    const next = phase === "to-login" ? "login" : "intro";
    const timer = window.setTimeout(() => setPhase(next), 450);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "1") message.error("邮箱或密码错误");
  }, [message]);

  const onFinish = (values: LoginForm) => {
    setLoading(true);
    postForm("/api/auth/login", { email: values.email, password: values.password });
  };

  return (
    <main
      ref={pageRef}
      className="relative flex min-h-screen cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#1c2430] px-6 py-12"
      onPointerMove={(event) => {
        const page = pageRef.current;
        if (!page) return;
        const rect = page.getBoundingClientRect();
        page.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        page.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }}
      onClick={() => {
        if (phase === "intro") setPhase("to-login");
        if (phase === "login") setPhase("to-intro");
      }}
    >
      <div className="login-blur pointer-events-none" />

      {(phase === "intro" || phase === "to-login") && (
      <section
        className={`relative w-full max-w-2xl text-center text-white transition-opacity duration-500 ${
          phase === "to-login" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <p className="login-rise text-sm tracking-widest text-white/60">个人独立网站项目</p>
        <h1 className="login-rise login-d1 mt-4 text-3xl font-semibold">智慧任务协作平台</h1>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
          前端采用 React 、TypeScript 与 Next.js，界面用 Tailwind CSS 和 Ant Design完成。
        </p>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
          后端使用 Next.js API Routes 处理请求，页面只通过接口读写数据。
        </p>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
          数据库使用 TiDB Cloud，数据由 Prisma 连接并落在 MySQL 中。
        </p>
        <p className="login-rise login-d3 mx-auto mt-4 max-w-xl text-sm leading-7 text-white/65">
          已完成工作台图表、项目任务流转、团队协作、成员分配与报告。独立跑通完整流程，登录后即可体验。
        </p>
        <p className="login-rise login-d6 mt-8 text-sm tracking-wide text-white/50">作者：b1t</p>
      </section>
      )}

      {(phase === "login" || phase === "to-intro") && (
        <section
          className={`relative w-full max-w-md transition-opacity duration-500 ${
            phase === "to-intro" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="login-fade-in" onClick={(event) => event.stopPropagation()}>
          <Card className="shadow-md" title="登录">
            <Form<LoginForm> form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
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
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password placeholder="密码" size="large" />
              </Form.Item>
              <Form.Item>
                <div className="flex gap-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    className="flex-1"
                  >
                    登录
                  </Button>
                  <Button
                    size="large"
                    variant="solid"
                    color="green"
                    onClick={() => {
                      form.setFieldsValue(DEMO);
                      message.success("已填入演示账号");
                    }}
                  >
                    演示账号
                  </Button>
                </div>
              </Form.Item>
              <div className="text-center text-sm text-gray-500">
                还没有账号？<Link href="/register">立即注册</Link>
              </div>
            </Form>
          </Card>
          </div>
        </section>
      )}
    </main>
  );
}
