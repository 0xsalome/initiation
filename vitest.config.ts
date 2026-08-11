// ABOUTME: Vitest 設定。Node 環境でサーバーサイドロジックをテストする。
// ABOUTME: ブラウザ/ウォレット依存のフローはテスト対象外(手動検証)。
import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// 統合テスト用に .env.local の Supabase 設定を読み込む(2026-08-07-vitest-env-local.md)。
// 値はログに出さず、シェルで設定済みの環境変数は上書きしない。
dotenv.config({ path: path.resolve(rootDir, ".env.local"), quiet: true });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // 統合テストは1つのローカルSupabaseを共有する。ファイルを並列に走らせると、
    // 片方の truncateAll がもう片方の実行中の行を消してしまう(Issue #37 で
    // 2ファイル目を足したときに外部キー違反として表面化した)。
    // 単体テストは十分速いので、分けずに全体を直列にしている。
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(rootDir) },
  },
});
