// ABOUTME: 遷移履歴から「どの操作にどの理由・tx hashが付いたか」を取り出す純粋ロジック。
// ABOUTME: applications の理由・tx hash列は上書きされるため、履歴側を正本にする(Issue #19, #33)。
import type { ApplicationEvent, StatusField } from "./types";

/** field ごとの最新の遷移。条件を満たすイベントがない field は入らない。 */
export type EventByField = Partial<Record<StatusField, ApplicationEvent>>;

/**
 * 申請IDごとに、field 単位で条件を満たす最新のイベントを取り出す。
 * 呼び出し側の並び順に依存しないよう、ここで新しい順へ並べ替える。
 */
function latestByField(
  events: ApplicationEvent[],
  matches: (event: ApplicationEvent) => boolean,
): Map<string, EventByField> {
  const newestFirst = [...events].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );

  const result = new Map<string, EventByField>();
  for (const event of newestFirst) {
    if (!matches(event)) continue;
    const forApplication = result.get(event.applicationId) ?? {};
    // 新しい順に見ているので、既に入っていればそちらが最新。
    if (forApplication[event.field]) continue;
    forApplication[event.field] = event;
    result.set(event.applicationId, forApplication);
  }
  return result;
}

/** 理由が記録された最新の遷移。理由のない遷移(承認など)は拾わない。 */
export function latestReasonsByApplication(
  events: ApplicationEvent[],
): Map<string, EventByField> {
  return latestByField(events, (event) => Boolean(event.reason));
}

/**
 * tx hash が記録された最新の遷移。
 * Allowlist の tx hash は applications 側に列がなく、履歴だけが持つ(Issue #33)。
 */
export function latestTxIdsByApplication(
  events: ApplicationEvent[],
): Map<string, EventByField> {
  return latestByField(events, (event) => Boolean(event.txId));
}
