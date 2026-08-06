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
