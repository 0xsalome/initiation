# 2026-08-11 Dependabotが壊したnpm lockfileを手動で復旧する

## 症状と原因

Dependabot導入後、npm依存を更新するPR #55、#57〜#60で、`build / typecheck / lint / unit`の`npm ci`が次の不整合を検出した。GitHub Actions更新だけのPR #56では発生していない。

```text
npm ci can only install packages when package.json and package-lock.json are in sync

Missing:
- @types/react@18.3.31
- react@18.3.1
- react-dom@18.3.1
- @types/prop-types@15.7.15
- scheduler@0.23.2
```

VitePress 1.6.4が依存する`@docsearch/js` 3.8.2は、React 18系をoptional peer dependencyとして持つ。Dependabotはrootのnpm依存を更新するとき、`package-lock.json`にある`optional: true`かつ`peer: true`の要素を削除し、その後に復元していなかった。

これは[dependabot-core Issue #15039](https://github.com/dependabot/dependabot-core/issues/15039)と同じ不具合である。[修正PR #15040](https://github.com/dependabot/dependabot-core/pull/15040)は、root依存の更新後にも削除されたoptional peer dependencyを復元する変更だが、2026-08-11時点では未マージである。

## 判断

CIの`npm ci`は変更しない。壊れたlockfileを検出したDependabot PRはマージせず、CIと同じnpmで`package-lock.json`を手動再生成してから、通常の`npm ci`で整合性を確認する。

この一時運用を採る根拠は次の実測結果である。

- PR #55は、GitHub ActionsのNode 22.23.1 / npm 10.9.8と同じ環境で不整合を再現した。
- `npm ci --omit=optional`と`npm ci --omit=peer`でも同じ5パッケージの欠損で失敗した。
- `npm ci --legacy-peer-deps`は成功したが、peer dependencyの契約を無視し、通常の`npm ci`と異なる依存ツリーを作った。
- npm 10.9.8でlockfileを再生成すると、削除された5パッケージに対応する65行だけが復元された。その後の通常の`npm ci`は成功した。
- `packageManager`やnpmのバージョン固定は、Dependabot側のlockfile後処理を修正しない。
- pnpm 10.34.5への変換はこのnpm固有の不具合を避けられる一方、DocSearchとReact、VitestとViteに未充足peer dependencyを生じた。一時回避のためにパッケージマネージャと依存解決を変える範囲を超えている。

## 復旧手順

まず、失敗したActionsログの`Environment details`でnpmバージョンを確認する。2026-08-11のPR #55ではnpm 10.9.8だった。以下はそのバージョンを使う例である。

対象のDependabot PRをcheckoutし、作業ツリーに意図しない変更がないことを確認する。

```bash
gh pr checkout 55
git status -sb
```

CIと同じnpmでlockfileだけを再生成する。

```bash
npx --yes npm@10.9.8 install --package-lock-only
git diff -- package-lock.json
```

差分を確認し、更新対象と無関係な依存変更やlockfileの大規模な書き換えがある場合はコミットせず、原因を調べる。今回の不具合では、Dependabotが削除したoptional peer dependencyの復元だけになることを期待する。

通常の`npm ci`でlockfileの整合性を確認し、リポジトリの検証を実行する。

```bash
npx --yes npm@10.9.8 ci
npm run build
npx tsc --noEmit
npm run lint
npm test
npm run docs:build
npm audit --omit=dev --audit-level=high
```

すべて成功し、出力に未確認の警告やエラーがなければ、復元された`package-lock.json`だけを対象PRへコミットする。Dependabot PRを人が変更するとDependabotの自動rebase対象外になる。`@dependabot recreate`は手動編集を上書きするため、マージまで差分とCIを再確認する。

## 既存PRの扱い

この決定をmainへ追加しても、既存のDependabotブランチは自動では修復されない。

- #55と#57は、それぞれのPRブランチで上記手順によりlockfileを復旧し、依存更新そのものを通常どおりレビューする。
- #58〜#60はmajor更新であり、この一時対策や他の依存更新へ混ぜない。lockfileの復旧はmajor更新を採用する根拠にはならないため、互換性を別途確認して判断する。
- #56はGitHub Actionsのみの更新で、このnpm lockfile不具合の対象外である。

upstream修正がDependabotへ反映された後は、対象PRへ`@dependabot recreate`とコメントし、Dependabot自身が整合したlockfileを生成することを確認する。`recreate`はPR上の手動編集を上書きするため、upstream修正の反映を確認する前には実行しない。

## 採らなかった対策

- CIの`npm ci`を`npm install`へ変える、またはCI内でlockfileを再生成する: 不正なlockfileを検出できないままマージ可能になる。
- `--legacy-peer-deps`を使う: peer dependencyの検証を全体で無効にする。
- optionalやpeerをCIのインストール対象から外す: 実測で不整合を解消せず、通常のインストールとも異なる。
- Dependabot PRを自動修復してcommitする: 書き込み権限の追加と、信頼境界をまたぐworkflowが必要になる。
- upstream修正と同じlockfile書き換えをリポジトリで実装する: npmのlockfile仕様とDependabot内部処理を二重に保守することになる。
- npm更新を停止する: 壊れたPRは減るが、依存更新の通知と追従まで止めてしまう。

## 一時運用の終了条件

修正PR #15040または同等の修正がDependabotへ反映され、`@dependabot recreate`したnpm更新PRで次を確認できた時点で、手動再生成を終了する。

1. `package-lock.json`からoptional peer dependencyが不当に削除されない。
2. 通常の`npm ci`が変更なしで成功する。
3. 同じ症状が次回の定期更新でも再発しない。

終了時はAGENTS.mdの一時手順への導線を削除する。この決定記録は、判断と障害履歴として残す。
