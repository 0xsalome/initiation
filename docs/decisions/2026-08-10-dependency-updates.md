# 2026-08-10 依存関係の更新と監査を自動化する(Issue #38)

- 課題: `.github/` にあるのは `workflows/ci.yml` と `workflows/docs.yml` だけで、`dependabot.yml` がなかった。CIも build / typecheck / lint / テストは実行するが、依存関係の監査は行っていなかった。#28（`@types/node` が `engines` の Node 22 要件とずれていた）は人が気づいて直したもので、同種のズレを拾う仕組みがなかった。

## 決定

### 1. 監査は本番依存のみ、high以上で落とす

```
npm audit --omit=dev --audit-level=high
```

**`--omit=dev`。** dev依存には `vitepress` → `vite` → `esbuild` の勧告が3件（moderate 2 / high 1）あり、いずれも `No fix available` で開発サーバー向けのものである。本番の配信物には含まれない。これを含めたままCIへ入れると**最初から赤い**（実測: 全依存 + `--audit-level=high` は exit 1、本番依存のみは exit 0）。常に赤いCIは通知として機能しなくなる。

**`--audit-level=high`。** 本番依存は現時点で0件なので、`--omit=dev` だけでも今日は通る。それでも閾値を置くのは、**修正の出ていないmoderateの勧告が1件出ただけで、無関係なPRまで全部止まる状態にしないため。** 本番依存にhigh以上が出たときは、実際に止めるべき事象として扱う。

moderate以下はDependabotのアラートと週次の更新PRで拾う。CIを止める基準と、気づく基準を分けている。

**独立したjobにした。** `static` のステップに足すと、監査で落ちたときにjob名（`build / typecheck / lint / unit`）が実態と食い違う。何が落ちたのかがチェック一覧から読めるようにした。`npm audit` は `package-lock.json` だけで動くので、このjobに `npm ci` は要らない。

### 2. 更新PRはminor/patchを束ねる

npmは週次、GitHub Actionsは月次。**minorとpatchは本番/開発の2グループへ束ねる。** 運営が少ない状況で1件ずつPRが来ると、週に何本も溜まってレビューが追いつかない。

majorは `groups` の対象外なので個別のPRになる。まとめて上げると、壊れたときにどれが原因か切り分けられないため、これは意図した挙動。

### 3. フレームワークのmajorは自動で上げない

`next` / `eslint-config-next` / `react` / `react-dom` のmajorは `ignore` する。

`AGENTS.md` が「This is NOT the Next.js you know」として警告しているとおり、**このNext.jsは学習データと異なる破壊的変更を含んでいて、`node_modules/next/dist/docs/` を読んでからでないと移行できない。** PRが飛んできても必ず手で作業することになるので、来ないほうがよい。reactはnextと足並みを揃える必要があるため同じ扱いにした。

**代償として、majorが出たことに自動では気づけない。** フレームワークの更新は意図して計画する作業として扱う。

### 4. 自動マージは使わない

CIが通ったパッチ更新を自動マージする運用は採らない。**このリポジトリのCIはブラウザ・ウォレット依存のフローを検証していない**（`vitest.config.ts` が明示している方針で、そこは手動検証）。`wagmi` や `viem` の更新が接続や署名を壊してもCIは緑のままになりうるので、人が見る前にmainへ入る形にはしない。

## 含めなかったもの

- 既存3件の勧告への対応（`vitepress` の更新待ちで `No fix available`）
- ライセンススキャン
- Renovate等との比較検討

## 未確認

**Dependabotのセキュリティアラート（脆弱性が出たときの自動PR）が有効かどうかは、この変更では確認できていない。** `dependabot.yml` が設定するのはバージョン更新のみで、セキュリティアラートはリポジトリの設定側にある。有効になっていない場合、本番依存の勧告に気づく経路はCIの監査jobだけになる。リポジトリ設定の Security → Dependabot alerts を確認したい。
