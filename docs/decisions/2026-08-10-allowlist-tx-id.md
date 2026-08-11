# 2026-08-10 Allowlist追加のtx hashの記録(Issue #33)

- 課題: `components/AdminApplicationRow.tsx` の「Allowlist 追加済みにする」が `txId` を渡さず、tx hash の入力欄も配布側にしかなかった。`docs/runbook-manual-operations.md` は「Allowlist操作のオンチェーンtx hashは、現行画面では配布状態と別に入力できないため、運用ログにも必ず記録する」として、手書きの運用ログで補う運用を指示していた。失敗の記録については「経緯がアプリ内に揃うため、運用ログ側に経緯を書き写す必要はない」としており、Allowlistのtx hashだけが例外として残っていた。

## 決定

### 1. スキーマは変更しない。記録先は `application_events.tx_id`

`application_events.tx_id` は `field` を問わず記録できる列として既にあり(`20260806000001_core_tables.sql`)、`transition_application` 関数も `p_tx_id` をそのまま INSERT する(`20260809000001_transition_application.sql`)。**Allowlistのtx hashは現在のスキーマのまま記録でき、マイグレーションは不要。**

- `applications` へ `allowlist_tx_id` 列は追加しない。監査記録としての正本は履歴側であり、`applications` 側の列は直近の1件で上書きされるキャッシュにすぎない(`2026-08-10-review-reason.md` と同じ整理)。
- `applications.distribution_tx_id` は既存の互換のため残す。`transition_application` は `p_field = 'distribution'` のときだけこの列を書くので、Allowlistのtx hashが配布用の列を汚すことはない。

### 2. Allowlist追加のtx hashを必須にする

`app/admin/actions.ts` で、`field: "allowlist"` かつ `toStatus: "added"` のとき tx hash を必須にする。配布の `sent` と同じ扱い。

- Runbook「3. Allowlistへ追加する」がAllowlist追加を**オンチェーントランザクションの実行**として定義しているため、完了として記録する時点では必ずtx hashが存在する。
- 完了の記録に確認記録を伴わせることで、「アプリ上はadded、実際には未実行」という状態を作りにくくする。
- **失敗(`failed`)には求めない。** トランザクションが成立していないため。失敗側は理由が必須のまま(`2026-08-08-record-failed-state.md`)で、成功は tx hash、失敗は理由という対応になる。

Allowlist管理がコントラクトではなくtx hashの出ない管理ツールで行われる運用になった場合、この必須は操作を止める。そのときは必須をやめ、入力欄だけを残す判断へ切り替える。

### 3. 表示は field ごとの最新1件

`lib/domain/applicationEvents.ts` の `latestReasonsByApplication` を `latestByField` として一般化し、`latestTxIdsByApplication` を同じ形で追加した。`/admin` は理由と tx hash の両方を field ごとに表示する。

- tx hash のない遷移(失敗の記録など)は拾わない。拾うと、tx hash を持たない失敗の記録が直前の成功時の hash を隠してしまう。理由側で「理由のない承認が却下理由を隠さない」ようにしたのと同じ理由。
- 履歴の全件表示は行わない(#34 で扱う)。ここで出すのは field ごとの最新1件まで。

## 含めなかったもの

- tx hash の形式検証(`0x` + 64桁など)。配布側も検証しておらず、片側だけ厳しくすると一貫しない。検証を入れるなら両方まとめて別途行う
- ブロックエクスプローラーへのリンク生成
- Allowlist操作のアプリからの自動実行(development-plan・Runbookのとおりスコープ外)
