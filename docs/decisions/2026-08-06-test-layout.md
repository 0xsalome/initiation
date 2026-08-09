# 2026-08-06 テストコードの配置

- テストコードは本番コードから分離し、`tests/unit/` と `tests/integration/` に配置する。
- Supabase接続とテーブル初期化は `tests/support/` に置き、統合テストだけがローカルDBを要求する。
- Vitestの対象は `tests/**/*.test.ts` に限定し、単体テストと外部依存のある統合テストを明確に分ける。
