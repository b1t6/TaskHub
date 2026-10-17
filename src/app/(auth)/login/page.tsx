"use client";

import { ArrowRightOutlined } from "@ant-design/icons";
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
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#1c2430] px-6 py-12 ${
        phase === "intro" ? "cursor-pointer" : ""
      }`}
      onPointerMove={(event) => {
        const page = pageRef.current;
        if (!page) return;
        const rect = page.getBoundingClientRect();
        page.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        page.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }}
      onClick={() => {
        if (phase === "intro") setPhase("to-login");
      }}
    >
      <div className="login-blur pointer-events-none" aria-hidden />
      <div className="login-orbs pointer-events-none" aria-hidden>
        <span className="login-orb login-orb-a" />
        <span className="login-orb login-orb-b" />
        <span className="login-orb login-orb-c" />
        <span className="login-orb login-orb-d" />
      </div>

      {(phase === "intro" || phase === "to-login") && (
      <section
        className={`relative w-full max-w-2xl text-center text-white transition-opacity duration-500 ${
          phase === "to-login" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <p className="login-rise text-sm tracking-widest text-white/60">个人独立实战项目</p>
        <h1 className="login-rise login-d1 mt-4 text-3xl font-semibold">任务协作平台</h1>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/90">
          前端采用 React 、TypeScript 与 Next.js，界面用 Tailwind CSS 和 Ant Design完成。
        </p>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/85">
          后端使用 Next.js API Routes 处理请求，页面只通过接口读写数据。
        </p>
        <p className="login-rise login-d2 mx-auto mt-5 max-w-xl text-sm leading-7 text-white/80">
          数据库服务器采用 TiDB Cloud，数据由 Prisma 连接并落在 MySQL 中。
        </p>
        <p className="login-rise login-d3 mx-auto mt-4 max-w-xl text-sm leading-7 text-white/75">
          从前后端分离、服务器搭建，再到网站部署上线，独立跑通完整流程，登录后即可体验。
        </p>
        <div className="login-rise login-d6 mt-8 flex justify-center gap-8 text-sm tracking-wide text-white/60">
          <p>作者：b1t</p>
          <p>邮箱：2223811718@qq.com</p>
        </div>
      </section>
      )}

      {(phase === "login" || phase === "to-intro") && (
        <section
          className={`relative w-full max-w-md transition-opacity duration-500 ${
            phase === "to-intro" ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="login-fade-in" onClick={(event) => event.stopPropagation()}>
          <Card
            className="shadow-md"
            title={
              <div className="flex items-center justify-between gap-3">
                <span>登录</span>
                <button
                  type="button"
                  aria-label="返回介绍"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  onClick={() => setPhase("to-intro")}
                >
                  <ArrowRightOutlined />
                </button>
              </div>
            }
          >
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
