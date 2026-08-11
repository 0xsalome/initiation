// ABOUTME: 遷移履歴から「どの操作にどの理由が付いたか」を取り出す純粋ロジック。
// ABOUTME: applications.reason は直近の理由で上書きされるため、履歴側を正本にする(Issue #19)。
import type { ApplicationEvent, StatusField } from "./types";

/** field ごとの「理由が記録された最新の遷移」。理由のない field は入らない。 */
export type ReasonByField = Partial<Record<StatusField, ApplicationEvent>>;

/**
 * 申請IDごとに、field 単位で理由付きの最新イベントを取り出す。
 * 呼び出し側の並び順に依存しないよう、ここで新しい順へ並べ替える。
 */
export function latestReasonsByApplication(
  events: ApplicationEvent[],
): Map<string, ReasonByField> {
  const newestFirst = [...events].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  const result = new Map<string, ReasonByField>();
  for (const event of newestFirst) {
    if (!event.reason) continue;
    const forApplication = result.get(event.applicationId) ?? {};
    // 新しい順に見ているので、既に入っていればそちらが最新。
    if (forApplication[event.field]) continue;
    forApplication[event.field] = event;
    result.set(event.applicationId, forApplication);
  }
  return result;
}
