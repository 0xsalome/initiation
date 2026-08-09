# 2026-08-06 フェーズ0完了とフェーズ1への申し送り

- 統合確認: ウォレット接続、SIWE サインイン、Polygon 切替、HENKAKU `watchAsset` を 1 ページに接続した。`npm test`（9 tests）、lint、typecheck が成功し、dev server の HTTP 200 も確認した。MetaMask の拒否・再試行とアカウント / チェーン変更時のセッション解除も手動確認済み。
- フェーズ1へ持ち越す本番品質コード: `lib/siwe.ts`、`lib/session.ts`、`lib/henkakuToken.ts` と `tests/unit/lib/siwe.test.ts`、`tests/unit/lib/henkakuToken.test.ts`。
- フェーズ1で捨てるもの: `scripts/sakura-ai-spike.ts`、`scripts/db-spike.ts`、`supabase/migrations/00000000000000_spike.sql`。正式 migration に置き換える際に削除する。
- フェーズ1計画: DB は Supabase 採用で前提どおりのため、計画の DB 選定箇所は変更不要。正式 migration では RLS / grant / API 公開範囲を明示する。
- 残る運用入力: `SESSION_PASSWORD`、Supabase の本番キー、管理者アドレス、HENKAKU コントラクトアドレス、ロゴ URL は `.env.local` / 管理設定で管理し、コミットしない。AI の月次上限・リセット時刻・429 停止動作はフェーズ3開始前に仕様化する。
