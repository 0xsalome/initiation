# 環境変数一覧

変数名の一覧は `.env.example` にあります。値は `.env.local` に設定します。

::: danger 秘密情報の扱い
`.env.local` はコミットされません（`.gitignore` で `.env*` を除外）。値をIssue、Pull Request、チャット、コマンドの実行結果へ貼り付けないでください。
:::

## 一覧

| 変数 | 用途 | 公開可否 |
| --- | --- | --- |
| `SESSION_PASSWORD` | セッション暗号化。32文字以上が必須 | 非公開 |
| `SUPABASE_URL` | Supabaseの接続先 | 環境による |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー側Repositoryの接続 | 非公開 |
| `ADMIN_ADDRESSES` | 管理画面を使えるウォレット（カンマ区切り） | アドレス自体は公開情報だが環境変数で管理 |
| `NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS` | Polygon上のHENKAKUコントラクト | 公開可 |
| `NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL` | トークン表示名 | 公開可 |
| `NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS` | トークン小数桁 | 公開可 |
| `NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL` | ウォレット表示用ロゴ | 公開可 |
| `SAKURA_AI_API_KEY` | AI Engineスパイク用キー | 非公開・現在は本番未使用 |
| `SAKURA_AI_BASE_URL` | AI EngineのベースURL | 環境変数で管理 |

`NEXT_PUBLIC_` で始まる変数は**ブラウザへ送られます。** 秘密情報をこの接頭辞で定義しないでください。

## 設定のしかた

### SESSION_PASSWORD

32文字以上のランダムな文字列を生成します。

```bash
openssl rand -base64 32
```

未設定または32文字未満の場合、`SESSION_PASSWORD must be at least 32 characters` が発生します。

### SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY

ローカル開発では `npx supabase status` の出力から設定します。

| `supabase status` の項目 | 設定先 |
| --- | --- |
| `API_URL` | `SUPABASE_URL` |
| `SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` |

### ADMIN_ADDRESSES

`/admin` を開けるウォレットアドレスをカンマ区切りで指定します。大文字小文字は区別されません（内部で正規化されます）。

```
ADMIN_ADDRESSES=0xaaa...,0xbbb...
```

**変更後は開発サーバーまたはデプロイの再起動が必要です。** 環境変数はプロセス起動時に読み込まれるためです。

`ADMIN_ADDRESSES` は管理画面へのアクセス制御にだけ使われ、トークンの配布権限を与えるものではありません。

### NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS

Polygon上のHENKAKUトークンのコントラクトアドレスです。

**この値は現在リポジトリに記載がありません**（[Issue #2](https://github.com/henkaku-center/initiation/issues/2)）。未設定だと `/setup` に「HENKAKU トークン設定がありません」と表示されます。

### SAKURA_AI_API_KEY / SAKURA_AI_BASE_URL

さくらのAI Engineの検証（フェーズ0のスパイク）で使ったものです。現在アプリの本番機能では使っていません。AIの導入はフェーズ3の予定です。

## テスト実行時の扱い

Vitestは `.env.local` を自動で読み込みます（`vitest.config.ts`）。すでにシェルで設定されている環境変数は上書きしないため、CIなどで環境変数を直接渡す方法も使えます。`.env.local` がない環境では何もしません。

## 関連

- [30分セットアップ](/guide/setup)
- [検証コマンド一覧](/reference/commands)
- [手動運用Runbook](/runbook-manual-operations)
