"use client";

import "@ant-design/v5-patch-for-react-19";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getQueryClient } from "@/lib/get-query-client";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "taskhub-theme";

const ThemeContext = createContext<{
  mode: ThemeMode;
  toggleTheme: () => void;
}>({
  mode: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => getQueryClient());
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next: ThemeMode = saved === "dark" ? "dark" : "light";
    setMode(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ mode, toggleTheme }}>
        <ConfigProvider
          locale={zhCN}
          theme={{
            algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: "#2563eb",
              borderRadius: 8,
            },
          }}
        >
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
