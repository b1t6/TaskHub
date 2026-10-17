import { QueryClient, isServer } from "@tanstack/react-query";
import { cache } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 30s 内切换页面直接用缓存，不再空白等待
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

const getServerQueryClient = cache(() => makeQueryClient());

/** 服务端：每个请求一个实例；浏览器：全局单例 */
export function getQueryClient() {
  if (isServer) return getServerQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
