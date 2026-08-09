# 2026-08-09 状態更新と監査イベントの原子化(Issue #21)

- 課題: Repository の `transition()` が `applications` の UPDATE と `application_events` の INSERT を別々のリクエストとして発行しており、同一トランザクションではなかった。UPDATE 成功後に INSERT が失敗すると、状態だけが変わって監査ログが残らない。Server Action は例外を返すため、管理者には操作が失敗したように見えるのに実際は遷移しており、再操作しようとしても遷移ルールで弾かれ得る。Allowlist追加とHENKAKU配布は人手のオンチェーン操作で、監査ログが唯一の裏付けであるため影響が大きい。
- 決定: Issue #21 の案A(Postgres関数への集約)を採る。`transition_application` 関数を追加し、条件付きUPDATEとイベントINSERTを1トランザクションで実行する。Repository は `rpc()` でこれを呼ぶだけにする。
- 案Bを採らなかった理由: 検知だけでは不整合そのものを防げない。監査ログは事後に人が信頼して読むものなので、「欠けたことに気づける」より「欠けない」ことを優先する。
- 責務の分担: どの遷移を許すかという知識はSQLへ持ち込まず、`lib/domain/applicationTransitions.ts` に残す。関数が担うのは「条件付きUPDATE + イベントINSERT」を不可分にすることだけ。遷移ルールを変えるたびにmigrationが必要になるのを避けるため。
- 競合の扱い: 0行更新のとき関数は例外ではなく NULL を返し、`ConcurrentTransitionError` への変換は Repository 側に残す。DBはドメインのエラー種別を知らなくてよい。#5 で導入した条件付き更新の意味は変わらない。
- 列名の対応付け: フィールド名から状態列への対応は関数側が持つ。TypeScript側の `STATUS_COLUMN` は列名を持たない `VALID_STATUS_FIELDS` に置き換え、対応表を二重に持たないようにした。
- 権限: 関数は SECURITY INVOKER のままとし、`anon` / `authenticated` / `public` から EXECUTE を revoke して `service_role` にのみ付与する。アプリはサーバー側の service_role 経由でのみDBへアクセスするという既存方針と揃える。SECURITY DEFINER は必要がないため使わない。
- 検証: `application_events.actor_address` の NOT NULL 制約を使ってイベントINSERTだけを失敗させ、状態が巻き戻ることを統合テストで固定した。旧実装を手で再現すると `review_status` が `approved` に変わったままイベント0件になることも確認している。
- 2026-08-08 の記録(`2026-08-08-atomic-application-transition.md`)にあった「両者の原子性が必要になった時点で Postgres 関数(RPC)への集約を検討する」という残課題は、これで解消した。
