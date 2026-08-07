// ABOUTME: Vitest 設定。Node 環境でサーバーサイドロジックをテストする。
// ABOUTME: ブラウザ/ウォレット依存のフローはテスト対象外(手動検証)。
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// 統合テスト用に .env.local の Supabase 設定を読み込む(2026-08-07 decisions.md)。
// 値はログに出さず、シェルで設定済みの環境変数は上書きしない。
dotenv.config({ path: path.resolve(rootDir, ".env.local"), quiet: true });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(rootDir) },
  },
});
