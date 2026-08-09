# 2026-08-08 申請ステータス遷移の競合制御(Issue #5)

- 課題: `transitionApplication` が listAll() で読んだ状態を `validateTransition` で検証した後、Repository の UPDATE が `id` のみを条件にしていたため、検証から更新までの間に別の管理者が遷移させても後勝ちで上書きできた。終端状態(`approved` / `rejected`)の保護という状態機械の不変条件が競合時に破れ、`application_events` にもルール上ありえない遷移が記録され得た。
- 決定: Repository の `transition()` に `expectedStatus`(呼び出し側が検証した時点の値)を渡し、UPDATE の条件に該当ステータス列の一致を加える条件付き更新(compare-and-set)にする。0行更新なら `ConcurrentTransitionError` を投げて何も書き換えない。
- 監査ログ: UPDATE 成功が「遷移前の値は `expectedStatus` だった」ことの保証になるため、遷移前の再読み取りをやめて `from_status` に `expectedStatus` を記録する。読み取りと更新の間のズレが原理的になくなる。
- UI: 管理画面は競合時に「他の管理者が先に状態を更新した」旨と再読み込みを促すメッセージを表示し、一覧は再取得しない(誤って上書きしたと誤解させないため)。
- ロック方式: 悲観ロックは採らない。管理操作は低頻度で、競合時は再読み込みして状態を見てから操作し直すのが運用上も正しいため。
- 残る課題: UPDATE と `application_events` の INSERT は同一トランザクションではないため、イベント記録だけが失敗すると監査ログが欠ける。両者の原子性が必要になった時点で Postgres 関数(RPC)への集約を検討する。
