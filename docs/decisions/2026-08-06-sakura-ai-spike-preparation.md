# 2026-08-06 さくらの AI Engine スパイク（準備）

- 公式仕様: OpenAI 互換の chat completions は `https://api.ai.sakura.ad.jp/v1/chat/completions`。認証は `Authorization: Bearer <アカウントトークン>`。
- 公式の利用手順にあるモデル例: `gpt-oss-120b`。
- 無償枠: chat completions は月 3,000 リクエストまで。超過時はレート制限。
- 応答の `usage` に `prompt_tokens` / `completion_tokens` / `total_tokens` が含まれる。
- 利用量・残枠の専用 API: 公開ドキュメント上で確認できず、レスポンスヘッダとコントロールパネルで実測する。
- 疎通: API キー未設定のため未実行。
- フェーズ3への引き継ぎ: アプリ側ではレスポンス `usage` を記録し、月次リクエスト上限と 429 時の停止動作を仕様化する。残枠の正確な取得方法はキー発行後に確定する。

参照: [利用手順](https://manual.sakura.ad.jp/cloud/ai-engine/02-howto.html)、[Inference API](https://manual.sakura.ad.jp/api/cloud/ai-engine/inference.html)
