// ABOUTME: Vitest 設定。Node 環境でサーバーサイドロジックをテストする。
// ABOUTME: ブラウザ/ウォレット依存のフローはテスト対象外(手動検証)。
import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(rootDir) },
  },
});
