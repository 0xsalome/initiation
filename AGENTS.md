# AGENTS.md

HENKAKU Initiation。docs/development-plan.md が全体計画、docs/superpowers/plans/ が実装計画。

- Node/npm は mise 経由: `mise exec -- npm <cmd>`
- テスト: `mise exec -- npm test`(Vitest)
- 環境変数は .env.local(コミット禁止)。変数名一覧は .env.example
- 決定事項は docs/decisions.md に記録

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
