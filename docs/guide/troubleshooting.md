# トラブルシューティング

症状から原因と対処を引けるようにしています。該当するものが見つからない場合は、[Issue](https://github.com/henkaku-center/initiation/issues) で報告してください。エラーメッセージを貼るときは、キーや秘密情報が含まれていないか確認してください。

## `Cannot find name 'LayoutProps'` で型チェックが失敗する

```
app/layout.tsx(22,50): error TS2304: Cannot find name 'LayoutProps'.
```

**原因**: `LayoutProps` はNext.jsがビルド時に生成する型です。クローン直後はまだ生成されていません。

**対処**: 先にビルドを実行します。

```bash
npm run build
npx tsc --noEmit
```

`npm run dev` を一度起動した場合も型が生成されます。

## 統合テストが `SUPABASE_SERVICE_ROLE_KEY` で失敗する

```
Error: SUPABASE_SERVICE_ROLE_KEY を設定してください(supabase status で取得)
 ❯ testClient tests/support/repositories.ts:8:19
```

**原因**: ローカルSupabaseが起動していないか、`.env.local` に接続情報が設定されていません。

**対処**:

```bash
npx supabase status
```

起動していない場合は `npx supabase start` を実行し、表示された `API_URL` と `SERVICE_ROLE_KEY` を `.env.local` の `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` へ設定します。

統合テストは `.env.local` を自動で読み込むため、設定後は `npm test` をそのまま実行できます。

::: tip 単体テストだけ実行したい場合
Supabaseを起動せずに単体テストだけ動かせます。

```bash
npx vitest run tests/unit
```
:::

## Docker / Supabase が起動しない

```
Cannot connect to the Docker daemon
```

**原因**: Docker Desktopが起動していません。

**対処**: Docker Desktopを起動してから、もう一度 `npx supabase start` を実行します。

```bash
docker info
```

サーバー情報が表示されれば起動しています。

### 起動が途中で止まる、コンテナの状態がおかしい

一度停止してから起動し直します。

```bash
npx supabase stop
npx supabase start
```

::: warning データが消えます
`npx supabase stop --no-backup` や `npx supabase db reset` は手元のデータベースの中身を消します。手元の開発用データなので通常は問題ありませんが、確認したい記録が残っている場合は先に控えてください。
:::

### `container is not ready: unhealthy` で失敗する

```
{"_tag":"Error","error":{"message":"supabase_db_initiation: container is not ready: unhealthy"}}
```

このメッセージ自体は原因を示していません。**本当の原因はその前に流れているログにあります。** Dockerの空き容量が足りない場合は、次の行が出ています。

```
initdb: error: could not create directory "/var/lib/postgresql/data/pg_wal": No space left on device
```

**対処**: Dockerが使っていない領域を削除してから、もう一度起動します。

```bash
docker system df       # 使用量と回収可能な容量を確認する
docker system prune -f # 停止中のコンテナ・未使用イメージを削除する
```

`docker system prune` は**動いていないコンテナと、どこからも使われていないイメージを消します。** 他のプロジェクトで使っているイメージも再取得が必要になる場合があるため、表示される確認内容を読んでから実行してください。

## `SESSION_PASSWORD must be at least 32 characters`

**原因**: `.env.local` の `SESSION_PASSWORD` が未設定か、32文字未満です。

**対処**: 32文字以上のランダムな文字列を生成して設定します。

```bash
openssl rand -base64 32
```

## 署名しても「サーバー検証に失敗しました」と表示される

**原因**: いくつかありますが、`.env.local` を古い版から引き継いでいる場合は `SIWE_ALLOWED_DOMAINS` の未設定が最も多い原因です。この変数が空だと、サーバーはすべての署名を拒否します。

**対処**: `.env.local` に次を追加して、開発サーバーを再起動します。

```
SIWE_ALLOWED_DOMAINS=localhost:3000
```

`npm run dev -- --port 3001` のように3000以外のポートで動かしている場合は、そのポートに合わせてください。ブラウザのアドレスバーに出ているホスト名とポートがそのまま値になります。

他に次の場合も同じメッセージになります。

- 署名してから時間が経ちすぎた（署名メッセージの有効期限は10分です）。もう一度署名してください
- ウォレットがPolygon以外につながっている。`/setup` のネットワーク切替を先に済ませてください

## 「HENKAKU トークン設定がありません」と表示される

`/setup` に次のように表示されます。

```
HENKAKU トークン設定がありません。NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS を設定してください。
```

**原因**: `NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS` が未設定です。`.env.example` には既定値が入っているので、`.env.local` を古い版から引き継いでいるか、手で消してしまった可能性があります。

**対処**: `.env.local` に次の値を設定して、開発サーバーを再起動します。

```
NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS=0x0cc91a5FFC2E9370eC565Ab42ECE33bbC08C11a2
```

`NEXT_PUBLIC_` で始まる変数はビルド時にブラウザ向けへ埋め込まれるため、**再起動しないと反映されません。**

## `/admin` が404になる

**原因**: 意図した動作です。`requireAdmin()` に失敗すると `notFound()` を返し、管理画面の存在自体を見せません。

**対処**: 次を確認します。

1. ウォレットでサインインしているか
2. `.env.local` の `ADMIN_ADDRESSES` に自分のアドレスが含まれているか
3. `ADMIN_ADDRESSES` を変更した後に開発サーバーを再起動したか

環境変数はプロセス起動時に読み込まれるため、**変更後は再起動が必要です。**

## ポートがすでに使われている

```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因**: 別の開発サーバーが同じポートで動いています。

**対処**: 使用中のプロセスを確認します。

```bash
lsof -ti:3000
```

既存のサーバーを使うか、別のポートで起動します。

```bash
npm run dev -- --port 3001
```

同じポートに新しいプロセスを重ねて起動しないでください。

## ウォレット接続・Polygon切り替え・SIWEに失敗する

**接続を拒否した場合**: ウォレットの拡張機能を開き、接続を承認してからもう一度試します。

**Polygonが登録されていない場合**: アプリからネットワークの追加を求められます。ウォレット側で承認してください。

**署名を拒否した場合**: サインインは完了しません。もう一度サインインを実行すると、新しい `nonce` が発行されます。

**アカウントやネットワークを切り替えた場合**: セッションが無効になります。これは意図した動作で、別のアカウントのセッションが残らないようにするためです。もう一度サインインしてください。

## `npm install` で脆弱性の警告が出る

現在、ドキュメントサイトの生成に使うVitePressが、開発サーバー向けの脆弱性を持つ依存（esbuild / vite）を含んでいます。

- 影響範囲は**ローカルで開発サーバーを動かしている間**に限られます
- ビルドして公開される静的サイトには影響しません
- VitePressの安定版に修正版がまだありません

詳細は[開発者ドキュメントサイトの導入](/decisions/2026-08-08-docs-site)に記録しています。

## 解決しないとき

次の情報を添えてIssueを立ててください。

- 実行したコマンド
- 表示されたエラーメッセージ（**キーや秘密情報を除く**）
- `node -v` と `npm -v` の出力
- OS
