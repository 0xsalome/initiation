import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/.temp/**",
    // VitePressのビルド成果物とキャッシュ(生成物なのでlint対象外)
    "docs/.vitepress/dist/**",
    "docs/.vitepress/cache/**",
  ]),
]);

export default eslintConfig;
