# AGENTS.md

HENKAKU Initiation。docs/development-plan.md が全体計画、docs/superpowers/plans/ が実装計画。

- Node/npm は mise 経由: `mise exec -- npm <cmd>`
- テスト: `mise exec -- npm test`(Vitest)
- 環境変数は .env.local(コミット禁止)。変数名一覧は .env.example
- 決定事項は docs/decisions.md に記録

## ページ構成

- `/setup`: ウォレット接続、SIWEサインイン、Polygon切替、HENKAKU追加
- `/initiation`: 質問・クエストの進捗保存と完走判定
- `/checkin`: 1日1回のチェックインと履歴
- `/apply`: Allowlist追加・HENKAKU配布の申請と状態表示
- `/admin`: `ADMIN_ADDRESSES` に登録された管理者向けの申請審査・状態更新

## ローカル検証コマンド

```bash
# 開発サーバー(既存のプロセスを確認してから起動する)
mise exec -- npm run dev -- --port 3000

# 単体・統合テスト
mise exec -- npm test

# 型チェック / lint / 本番build
mise exec -- npx tsc --noEmit
mise exec -- npm run lint
mise exec -- npm run build

# ローカルSupabase
mise exec -- npx supabase start
mise exec -- npx supabase status
mise exec -- npx supabase db reset  # ローカルDBを初期化する場合のみ
```

統合テストはローカルSupabaseのサービスキーを環境変数へ渡して実行する。キーの値をログやコマンド出力に表示しない。本番Supabaseへのmigration適用とVercelデプロイは、運用入力と公開前チェックが確定してから行う。

## テスト配置

- `tests/unit/`: Server Action、ドメイン、認証ガードなどの単体テスト
- `tests/integration/`: ローカルSupabaseへ接続するRepositoryテスト
- `tests/support/`: 統合テスト用のDB初期化・補助コード
- Vitestの対象は `tests/**/*.test.ts`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
