# 決定事項ログ

## 2026-08-06 さくらの AI Engine スパイク（準備）

- 公式仕様: OpenAI 互換の chat completions は `https://api.ai.sakura.ad.jp/v1/chat/completions`。認証は `Authorization: Bearer <アカウントトークン>`。
- 公式の利用手順にあるモデル例: `gpt-oss-120b`。
- 無償枠: chat completions は月 3,000 リクエストまで。超過時はレート制限。
- 応答の `usage` に `prompt_tokens` / `completion_tokens` / `total_tokens` が含まれる。
- 利用量・残枠の専用 API: 公開ドキュメント上で確認できず、レスポンスヘッダとコントロールパネルで実測する。
- 疎通: API キー未設定のため未実行。
- フェーズ3への引き継ぎ: アプリ側ではレスポンス `usage` を記録し、月次リクエスト上限と 429 時の停止動作を仕様化する。残枠の正確な取得方法はキー発行後に確定する。

参照: [利用手順](https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html)、[Inference API](https://manual.sakura.ad.jp/api/cloud/ai-engine/inference.html)

## 2026-08-06 さくらの AI Engine スパイク結果

- 疎通: 成功。`https://api.ai.sakura.ad.jp/v1/chat/completions` に `gpt-oss-120b` でリクエストし、HTTP 200 と応答本文を確認した。
- 利用量: レスポンス `usage` で取得できた（実測値: `prompt_tokens=83`、`completion_tokens=177`、`total_tokens=260`）。
- レート制限ヘッダ: `x-ratelimit-remaining` / `x-ratelimit-limit` / `retry-after` は今回すべて未返却だった。
- 利用量・残枠の取得方法: 専用 API は公式公開ドキュメントで確認できず、レスポンス `usage` の記録とコントロールパネル確認を併用する。
- 上限と超過時挙動: 無償プランの chat completions は月 3,000 リクエストまで。超過時はレート制限（API 仕様上の HTTP 429）となる。429 の実機再現は未実施。
- フェーズ3への引き継ぎ: アプリ側で `usage` を記録し、月次リクエスト数の上限到達前に停止する。残枠の正確な取得方法、月次リセット時刻、同時実行時の扱いはフェーズ3開始前に確定する。

## 2026-08-06 DB 選定

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

## 2026-08-06 フェーズ0完了とフェーズ1への申し送り

- 統合確認: ウォレット接続、SIWE サインイン、Polygon 切替、HENKAKU `watchAsset` を 1 ページに接続した。`npm test`（9 tests）、lint、typecheck が成功し、dev server の HTTP 200 も確認した。MetaMask の拒否・再試行とアカウント / チェーン変更時のセッション解除も手動確認済み。
- フェーズ1へ持ち越す本番品質コード: `lib/siwe.ts`、`lib/session.ts`、`lib/henkakuToken.ts` と `tests/unit/lib/siwe.test.ts`、`tests/unit/lib/henkakuToken.test.ts`。
- フェーズ1で捨てるもの: `scripts/sakura-ai-spike.ts`、`scripts/db-spike.ts`、`supabase/migrations/00000000000000_spike.sql`。正式 migration に置き換える際に削除する。
- フェーズ1計画: DB は Supabase 採用で前提どおりのため、計画の DB 選定箇所は変更不要。正式 migration では RLS / grant / API 公開範囲を明示する。
- 残る運用入力: `SESSION_PASSWORD`、Supabase の本番キー、管理者アドレス、HENKAKU コントラクトアドレス、ロゴ URL は `.env.local` / 管理設定で管理し、コミットしない。AI の月次上限・リセット時刻・429 停止動作はフェーズ3開始前に仕様化する。

## 2026-08-06 テストコードの配置

- テストコードは本番コードから分離し、`tests/unit/` と `tests/integration/` に配置する。
- Supabase接続とテーブル初期化は `tests/support/` に置き、統合テストだけがローカルDBを要求する。
- Vitestの対象は `tests/**/*.test.ts` に限定し、単体テストと外部依存のある統合テストを明確に分ける。

## 2026-08-06 フェーズ1ローカル確認と本番デプロイ延期

- ローカル実装: `/setup`、`/initiation`、`/checkin`、`/apply`、`/admin` の画面とServer Actionを実装した。
- 自動確認: Vitest 62件、TypeScript、lint、本番buildが成功した。管理者ウォレットで `/admin` の状態遷移も確認した。
- 本番デプロイ: Vercel / Supabase 本番プロジェクトへの変更は、運用準備と本番環境情報が揃うまで延期する。現時点では本番環境を作成・変更しない。
- 再開条件: 本番Supabaseプロジェクト、Vercelプロジェクト、`SESSION_PASSWORD`・Supabaseキー・`ADMIN_ADDRESSES`等の環境変数、公開前のプライバシー方針を確定する。Safe Walletからの実配布を含む本番一巡確認はその後に行う。

## 2026-08-07 統合テストの環境変数読み込み(Issue #1)

- 課題: `.env.local` に Supabase の値を設定しても、Vitest はこれを読まないため統合テストが失敗する。READMEだけを読む新規コントリビューターは、シェルで環境変数を渡す必要があることに辿り着けなかった。
- 決定: `vitest.config.ts` で dotenv により `.env.local` を読み込む。
- 秘密情報の方針との整合: dotenv はキーの値をログに出力しない(件数とパスのみ。`quiet: true` でそれも抑止)。「キーの値をログやコマンド出力に表示しない」方針(AGENTS.md)と矛盾しない。
- 既存運用との互換: dotenv は設定済みの環境変数を上書きしないため、CI やシェルから環境変数を渡す従来の実行方法もそのまま使える。`.env.local` が存在しない環境ではno-opで、単体テストのみの実行に影響しない。
- 対象は Vitest のみ。`next dev` / `next build` は従来どおり Next.js 自身が `.env.local` を読む。

## 2026-08-08 申請ステータス遷移の競合制御(Issue #5)

- 課題: `transitionApplication` が listAll() で読んだ状態を `validateTransition` で検証した後、Repository の UPDATE が `id` のみを条件にしていたため、検証から更新までの間に別の管理者が遷移させても後勝ちで上書きできた。終端状態(`approved` / `rejected`)の保護という状態機械の不変条件が競合時に破れ、`application_events` にもルール上ありえない遷移が記録され得た。
- 決定: Repository の `transition()` に `expectedStatus`(呼び出し側が検証した時点の値)を渡し、UPDATE の条件に該当ステータス列の一致を加える条件付き更新(compare-and-set)にする。0行更新なら `ConcurrentTransitionError` を投げて何も書き換えない。
- 監査ログ: UPDATE 成功が「遷移前の値は `expectedStatus` だった」ことの保証になるため、遷移前の再読み取りをやめて `from_status` に `expectedStatus` を記録する。読み取りと更新の間のズレが原理的になくなる。
- UI: 管理画面は競合時に「他の管理者が先に状態を更新した」旨と再読み込みを促すメッセージを表示し、一覧は再取得しない(誤って上書きしたと誤解させないため)。
- ロック方式: 悲観ロックは採らない。管理操作は低頻度で、競合時は再読み込みして状態を見てから操作し直すのが運用上も正しいため。
- 残る課題: UPDATE と `application_events` の INSERT は同一トランザクションではないため、イベント記録だけが失敗すると監査ログが欠ける。両者の原子性が必要になった時点で Postgres 関数(RPC)への集約を検討する。

## 2026-08-08 failed 状態の記録手段(Issue #8)

- 課題: `failed` は状態機械に定義されているのに管理画面から設定できず、Runbookが直接DB書き込みを案内していた。直接書き込みは `application_events` を経由しないため、オンチェーン操作の失敗という最も記録が必要な場面で監査証跡が残らなかった。
- 決定: `/admin` に「Allowlist 失敗として記録」「配布 失敗として記録」を追加し、`failed` への遷移も他の操作と同じ Server Action と監査記録の経路を通す。
- 失敗理由: 必須にする。Runbookが「承認者が理由を記録したうえで」と定めており、再試行の判断材料になるため。空白のみの入力は理由なしとして扱う。理由入力は失敗操作にのみ追加し、却下理由が固定値(`"運営判断"`)である点は別課題として残す。
- 申請者への表示: `failed` は「運営が対応中です」と表示し、`pending`(未実施)と区別する。失敗の詳細は申請者側で対処できないため出さない。表示文言はコミュニティで確定するまでの暫定とする。
- 状態機械は変更しない: `failed -> failed` は許可しないままとする。2回目以降の失敗の経緯は運用ログへ記録する運用とし、画面から複数回記録する必要が出た時点で再検討する。

## 2026-08-09 Node.js の最低対応バージョンを 22 に引き上げる

- 課題: README / AGENTS.md が「Node.js 20.9 以上」と案内していたが、`package-lock.json` の `@supabase/supabase-js` と関連パッケージ(`auth-js` / `postgrest-js` / `realtime-js` / `storage-js` / `functions-js`)が `engines.node >=22.0.0` を要求している。Node.js 20 では `npm install` が `EBADENGINE` を出し、build とテストでも警告が出る。手順どおりに Node.js 20 を用意した新規コントリビューターがサポート外の環境になっていた。
- 決定: 最低対応を Node.js 22.0.0 以上とし、README・AGENTS.md の表記を揃える。あわせて `package.json` に `engines.node` を宣言し、依存関係と文書のどちらが正かを曖昧にしない。
- `engines` を宣言する理由: 宣言がないと npm はルートパッケージの Node 要件を検査せず、非対応バージョンでも警告が依存パッケージ由来のものに埋もれる。宣言しておけば `npm install` の時点で気付ける。
- 採らなかった案: Node.js 20 対応の依存バージョンへ固定する案。Node.js 20 は 2026-04 に EOL を迎えており、サポート切れの環境に合わせて Supabase クライアントを古い版へ留めるのは割に合わない。
- 影響範囲: CI の Node マトリクスも 22 以上に揃える必要がある(Issue #7 / PR #9)。
