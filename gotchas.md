# Gotchas

- 2026-08-06: さくらの AI Engine は `SAKURA_AI_BASE_URL` に URL、`SAKURA_AI_API_KEY` にアカウントトークンを設定する。診断時はキーの値を出力せず、URL 形式だけを検証する。
- 2026-08-06: wagmiの接続状態をSSRページで描画する場合は`createConfig({ ssr: true })`を設定する。MetaMaskの再接続がHydration前に走ると、サーバーの接続ボタンとクライアントの接続済み表示が不一致になる。
- 2026-08-06: Next.js App Routerのページは必ず`app/<route>/page.tsx`に置く。ルート直下の同名ディレクトリではルートとして認識されず、buildのルート一覧から漏れる。
