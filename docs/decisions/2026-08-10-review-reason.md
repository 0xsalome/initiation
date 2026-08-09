# 2026-08-10 却下・要追加情報の理由の扱い(Issue #19)

- 課題: 却下理由が `components/AdminApplicationRow.tsx` に固定値 `"運営判断"` としてハードコードされ、承認者が理由を入力する手段がなかった。「要追加情報」は `reason` を渡していなかった。`applications.reason` 列は `app/` `components/` のどこからも読まれておらず、Runbook が求める「理由を残す」が実質的に機能していなかった。さらに `findActiveByMember` が却下済みを除外するため、`app/apply/page.tsx` の `rejected: "見送りになりました"` は到達不能なコードで、却下された申請者にはフォームが再表示されるだけだった。

## 決定

### 1. 却下と要追加情報は理由を必須にする

`app/admin/actions.ts` で、`field: "review"` かつ `toStatus` が `rejected` / `needs_info` のとき、空文字・空白のみの理由を拒否する。

- 既に `failed` の記録が理由必須(`2026-08-08-record-failed-state.md`)なので、規則を揃える。
- **承認は必須にしない。** 承認は結果が状態から追え、申請者へ伝える文面も必要ないため。
- 要追加情報を必須にしたのは、理由のない「要追加情報」は申請者が何を出せばよいか分からず、操作として成立しないため。Issue #19 もこの点を課題として挙げている。

### 2. 却下と理由は申請者に見せる。重複申請の判定は変えない

`ApplicationRepository` に `findLatestByMember` を追加し、`/apply` はこちらを使う。却下済みも含めた直近の申請を返す。

- **`findActiveByMember` は変更しない。** これは重複申請の判定(`applications_active_per_member` は `rejected` を対象外にしている)に対応する契約で、ここを変えると再申請ができなくなる。用途が違うので別メソッドに分けた。
- 却下時は Allowlist と配布の行を隠し、「もう一度申請できます」と再申請ボタンを出す。見送りになった申請でこの2つの状態を見せても意味がないため。
- 却下・要追加情報の理由のみ表示する。Allowlist・配布の失敗理由は申請者側で対処できないため従来どおり「運営が対応中です」に留める(`lib/applicationLabels.ts`)。

### 3. 理由は `application_events` から読む。`applications.reason` 列は分割しない

`application_events` は当初から `field` / `from_status` / `to_status` / `actor_address` / `reason` / `created_at` を1操作ずつ記録している(`supabase/migrations/20260806000001_core_tables.sql`)。**「どの操作にどの理由が付いたか」はこの履歴が既に持っている。**

- `ApplicationRepository.listEvents(applicationIds)` を追加し、`lib/domain/applicationEvents.ts` の `latestReasonsByApplication` で field ごとの最新の理由を取り出す。
- `applications.reason` を `review_reason` / `allowlist_reason` / `distribution_reason` へ分割する案は採らない。マイグレーションと `transition_application` 関数の改修が必要になる一方、得られる情報は履歴側に既にある。
- `applications.reason` は「直近の理由」のキャッシュとしてそのまま残す。上書きされる列であることは変わらないので、画面はこの列を読まない。
- 理由のない遷移(承認など)は履歴から拾わない。拾うと、理由なしの承認が直前の却下理由を隠してしまう。
- `/admin` は一覧の全申請分をまとめて1回で取得する(申請ごとに問い合わせない)。

## 含めなかったもの

Issue #19 が明示的にスコープ外としたもの。

- 申請者への通知機能(メール・Discord等)
- 監査ログ(`application_events`)そのものを一覧表示する画面

`/admin` に出すのは field ごとの最新の理由1件までで、履歴の全件表示は別途とする。
