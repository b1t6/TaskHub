import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  // 前后端分离：客户端组件禁止直接访问服务端模块
  // Next.js 服务端入口（page/layout 等）允许调用 @/server
  {
    files: ["src/**/*.tsx"],
    ignores: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/template.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/**/default.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@/lib/db", "@/server", "@/server/**"],
              message:
                "前后端分离约束：客户端组件禁止直接访问数据库/服务端模块，请通过 @/lib/api 调用后端 API。",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
