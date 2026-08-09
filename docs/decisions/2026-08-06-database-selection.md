# 2026-08-06 DB 選定

| 観点 | Supabase | Google Spreadsheet | VPS PostgreSQL |
|---|---|---|---|
| 接続 | ローカル Supabase を起動し、Supabase JS から接続できた | API クライアント経由。Sheets API の read/write quota と認証設定が必要 | PostgreSQL クライアントを自前で接続設定する必要がある |
| migration | `supabase db reset` で SQL migration を適用できた | DB migration の仕組みはなく、列・行構造の変更を別途運用する | SQL migration ツールを自前で選定・運用する |
| バックアップ / 復旧 | 有料プランは日次バックアップ、PITR は有料 add-on。Free は CLI export を自前運用 | スプレッドシートの版履歴・エクスポートに依存 | `pg_dump` / `pg_restore`、保管先、監視を自前で構築する |
| 同時更新 | 同一 wallet の並行 insert は 1 件成功 + `23505` unique violation、rows=1 を実測 | API は同時リクエスト可能だが、公式は spreadsheet 単位の同時実行を 1 req/s に制限するよう案内 | PostgreSQL の unique 制約・トランザクションを利用できる |

**決定**: Supabase をフェーズ1の第一候補として採用する。ホスト付き PostgreSQL、SQL migration、Repository 層との境界、同時更新の制約が MVP-1 の要件に最も合う。

**Spreadsheet の位置づけ**: 主 DB にはしない。管理用ミラー・エクスポート先として、低頻度の一覧出力に限定して検討する。Sheets API の quota 超過は 429 と exponential backoff が必要で、業務データの一意制約・監査履歴を DB の代替として担わせない。

**VPS**: 常時稼働プロセス、特殊な PostgreSQL 拡張、運用要件が明確になった時点で再評価する。現段階ではバックアップ・監視・アップグレードの運用負担を引き受ける理由がない。

補足: 現行 Supabase CLI は新規テーブルを API に自動公開しない設定のため、スパイク migration では `service_role` への権限付与が必要だった。フェーズ1の正式 migration でも API 公開範囲と RLS / grant を明示する。

参照: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)、[Google Sheets API usage limits](https://developers.google.com/workspace/sheets/api/limits)、[Google Sheets API concurrency guidance](https://developers.google.com/workspace/sheets/api/troubleshoot-api-errors)
