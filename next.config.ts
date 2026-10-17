import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 客户端路由短时复用 RSC 结果，减少「点一下就整页等服务器」的体感
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
