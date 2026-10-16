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
  // 前后端分离强制约束：
  // .tsx 文件属于前端层（页面/组件），禁止直接访问数据库或服务端模块，
  // 必须通过 src/lib/api 契约层与后端交互
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client", "@/lib/db", "@/server", "@/server/**"],
              message:
                "前后端分离约束：前端代码禁止直接访问数据库/服务端模块，请通过 @/lib/api 调用后端 API。",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
