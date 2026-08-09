# 2026-08-09 HENKAKU トークン設定値の確定(Issue #2)

- 課題: `NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS` と `NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL` がリポジトリのどこにも記載されておらず、READMEどおりに `.env.example` をコピーしただけでは `/setup` が「HENKAKU トークン設定がありません」で止まっていた。値は公開情報なので秘匿する理由がなく、新規コントリビューターが自力では辿り着けない状態だった。
- 決定: 以下を開発用の既定値として `.env.example` に記載する。4つとも公開情報のため、`cp .env.example .env.local` だけで `/setup` が動く。

  | 変数 | 値 |
  | --- | --- |
  | `NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS` | `0x0cc91a5FFC2E9370eC565Ab42ECE33bbC08C11a2` |
  | `NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL` | `HENKAKU` |
  | `NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS` | `18` |
  | `NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL` | `https://raw.githubusercontent.com/henkaku-center/omise-interface/main/public/henkakuToken.png` |

- 根拠(アドレス): [omise-interface](https://github.com/henkaku-center/omise-interface) の `utils/contractAddress.ts` にある `henkakuErc20` の Polygon エントリ。`docs/development-plan.md` が `/setup` を [omise.henkaku.org/shiniri](https://omise.henkaku.org/shiniri/) の同等機能の再実装と位置づけており、shiniri のページはこの値を `wallet_watchAsset` へ渡している。同じアドレスが henkaku-center 配下の5リポジトリで一致した。
- 根拠(symbol / decimals): Polygon メインネット上の当該コントラクトへ `symbol()` / `decimals()` を実行し、`HENKAKU` / `18` を確認した(独立した2つの公開RPCで一致)。shiniri 自身は wagmi の `useToken` でオンチェーンから取得しており、この値と矛盾しない。
- V1 との区別: 同ファイルには `henkakuV1Erc20`(`0xd59FFEE93A55F67CeD0F56fa4A991d4c8c8f5C4E`)も存在する。採用したのは **V2**(`henkakuErc20` と `henkakuV2Erc20` が同一値)で、shiniri が使っているのも `henkakuErc20` のため現行はV2と判断した。
- ロゴURL: 当初 `https://omise.henkaku.org/henkakuToken.png` を候補としたが、omise の稼働に依存させないため GitHub の raw URL を採用する(2026-08-08 の Issue #2 での指示)。同一の画像で、HTTP 200 / `image/png` / 20,772 bytes を確認済み。
- 位置づけ: これは**開発用の既定値**であり、正式運用に向けて変更が必要になった場合は改めて更新する。`lib/henkakuToken.ts` は引き続きコードへハードコードせず env から読む。
