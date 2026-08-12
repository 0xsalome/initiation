// ABOUTME: 申請1件の遷移履歴(application_events)を折りたたみで表示する。
// ABOUTME: 状態更新と同一トランザクションで残った記録を、DBへ直接繋がずに読めるようにする。
import { fieldLabel } from "@/lib/applicationEventLabels";
import { shortenAddress } from "@/lib/domain/address";
import type { ApplicationEvent } from "@/lib/domain/types";

export function AdminApplicationHistory({ events }: { events: ApplicationEvent[] }) {
  if (events.length === 0) return null;

  return (
    <details className="mt-3 border-t border-border pt-3 text-sm">
      <summary className="cursor-pointer font-semibold text-muted">
        履歴（{events.length}件）
      </summary>
      <ol className="mt-2 space-y-2">
        {events.map((event) => (
          <li key={event.id} className="border-l-2 border-border pl-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold text-foreground">
                {fieldLabel(event.field)}
              </span>
              {/* from_status は最初の遷移で null になりうる。 */}
              <span className="font-mono text-xs text-muted">
                {event.fromStatus ?? "—"} → {event.toStatus}
              </span>
              <time className="text-xs text-muted" dateTime={event.createdAt}>
                {new Date(event.createdAt).toLocaleString("ja-JP")}
              </time>
              <span className="font-mono text-xs text-muted" title={event.actorAddress}>
                {shortenAddress(event.actorAddress)}
              </span>
            </div>
            {event.reason && <p className="mt-1 leading-6 text-foreground">{event.reason}</p>}
            {event.txId && (
              <p className="mt-1 break-all font-mono text-xs text-foreground">{event.txId}</p>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}
