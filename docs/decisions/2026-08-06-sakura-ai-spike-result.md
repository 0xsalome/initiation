# 2026-08-06 さくらの AI Engine スパイク結果

- 疎通: 成功。`https://api.ai.sakura.ad.jp/v1/chat/completions` に `gpt-oss-120b` でリクエストし、HTTP 200 と応答本文を確認した。
- 利用量: レスポンス `usage` で取得できた（実測値: `prompt_tokens=83`、`completion_tokens=177`、`total_tokens=260`）。
- レート制限ヘッダ: `x-ratelimit-remaining` / `x-ratelimit-limit` / `retry-after` は今回すべて未返却だった。
- 利用量・残枠の取得方法: 専用 API は公式公開ドキュメントで確認できず、レスポンス `usage` の記録とコントロールパネル確認を併用する。
- 上限と超過時挙動: 無償プランの chat completions は月 3,000 リクエストまで。超過時はレート制限（API 仕様上の HTTP 429）となる。429 の実機再現は未実施。
- フェーズ3への引き継ぎ: アプリ側で `usage` を記録し、月次リクエスト数の上限到達前に停止する。残枠の正確な取得方法、月次リセット時刻、同時実行時の扱いはフェーズ3開始前に確定する。
