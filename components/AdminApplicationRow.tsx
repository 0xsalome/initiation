// ABOUTME: 申請1件の行と、現在状態に応じた管理操作を表示する。
// ABOUTME: 状態変更はServer Actionへ委譲し、成功後に一覧を再取得する。
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ApplicationWithMember, StatusField } from "@/lib/domain/types";
import { transitionApplication } from "@/app/admin/actions";
import { buttonStyles, inputStyles } from "@/lib/ui";

export function AdminApplicationRow({ application }: { application: ApplicationWithMember }) {
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(field: StatusField, toStatus: string, extra?: { reason?: string; txId?: string }) {
    setError(null);
    startTransition(async () => {
      const result = await transitionApplication({
        applicationId: application.id,
        field,
        toStatus,
        ...extra,
      });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "操作に失敗しました");
      }
    });
  }

  const review = application.reviewStatus;

  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <span className="font-mono text-xs text-foreground" title={application.walletAddress}>
          {application.walletAddress}
        </span>
        {application.displayName && <small className="mt-1 block text-muted">（{application.displayName}）</small>}
      </td>
      <td className="px-4 py-4 font-semibold text-foreground">{review}</td>
      <td className="px-4 py-4 font-semibold text-foreground">{application.allowlistStatus}</td>
      <td className="px-4 py-4 font-semibold text-foreground">{application.distributionStatus}</td>
      <td className="min-w-[28rem] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {(review === "pending" || review === "needs_info") && (
            <>
            <button className={buttonStyles.primary} type="button" disabled={pending} onClick={() => run("review", "approved")}>
              承認
            </button>
            <button
              className={buttonStyles.secondary}
              type="button"
              disabled={pending}
              onClick={() => run("review", "rejected", { reason: "運営判断" })}
            >
              却下
            </button>
            {review === "pending" && (
              <button className={buttonStyles.quiet} type="button" disabled={pending} onClick={() => run("review", "needs_info")}>
                要追加情報
              </button>
            )}
            </>
          )}
          {review === "approved" && application.allowlistStatus !== "added" && (
            <button className={buttonStyles.secondary} type="button" disabled={pending} onClick={() => run("allowlist", "added")}>
              Allowlist 追加済みにする
            </button>
          )}
          {review === "approved" && application.distributionStatus !== "sent" && (
            <>
              <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                <span className="sr-only">配布 tx hash</span>
              <input
                className={`${inputStyles} inline-block w-64 text-sm`}
                type="text"
                value={txId}
                onChange={(event) => setTxId(event.target.value)}
                placeholder="0x…"
              />
              </label>
              <button
                className={buttonStyles.primary}
                type="button"
                disabled={pending}
                onClick={() => run("distribution", "sent", { txId })}
              >
                配布済みにする
              </button>
            </>
          )}
          {review === "approved" &&
            (application.allowlistStatus === "pending" || application.distributionStatus === "pending") && (
              <>
                <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <span className="sr-only">失敗理由</span>
                  <input
                    className={`${inputStyles} inline-block w-64 text-sm`}
                    type="text"
                    value={failureReason}
                    onChange={(event) => setFailureReason(event.target.value)}
                    placeholder="失敗理由（失敗として記録する場合）"
                  />
                </label>
                {application.allowlistStatus === "pending" && (
                  <button
                    className={buttonStyles.quiet}
                    type="button"
                    disabled={pending}
                    onClick={() => run("allowlist", "failed", { reason: failureReason })}
                  >
                    Allowlist 失敗として記録
                  </button>
                )}
                {application.distributionStatus === "pending" && (
                  <button
                    className={buttonStyles.quiet}
                    type="button"
                    disabled={pending}
                    onClick={() => run("distribution", "failed", { reason: failureReason })}
                  >
                    配布 失敗として記録
                  </button>
                )}
              </>
            )}
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300" role="alert">{error}</p>}
      </td>
    </tr>
  );
}
