// ABOUTME: 申請1件の行と、現在状態に応じた管理操作を表示する。
// ABOUTME: 状態変更はServer Actionへ委譲し、成功後に一覧を再取得する。
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ApplicationWithMember, StatusField } from "@/lib/domain/types";
import { transitionApplication } from "@/app/admin/actions";

export function AdminApplicationRow({ application }: { application: ApplicationWithMember }) {
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState("");
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
    <tr>
      <td>
        <span title={application.walletAddress}>{application.walletAddress}</span>
        {application.displayName && <small>（{application.displayName}）</small>}
      </td>
      <td>{review}</td>
      <td>{application.allowlistStatus}</td>
      <td>{application.distributionStatus}</td>
      <td>
        {(review === "pending" || review === "needs_info") && (
          <>
            <button type="button" disabled={pending} onClick={() => run("review", "approved")}>
              承認
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run("review", "rejected", { reason: "運営判断" })}
            >
              却下
            </button>
            {review === "pending" && (
              <button type="button" disabled={pending} onClick={() => run("review", "needs_info")}>
                要追加情報
              </button>
            )}
          </>
        )}
        {review === "approved" && application.allowlistStatus !== "added" && (
          <button type="button" disabled={pending} onClick={() => run("allowlist", "added")}>
            Allowlist 追加済みにする
          </button>
        )}
        {review === "approved" && application.distributionStatus !== "sent" && (
          <>
            <label>
              配布 tx hash
              <input
                type="text"
                value={txId}
                onChange={(event) => setTxId(event.target.value)}
                placeholder="0x…"
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => run("distribution", "sent", { txId })}
            >
              配布済みにする
            </button>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </td>
    </tr>
  );
}
