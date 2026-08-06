// ABOUTME: 申請実行ボタンを提供する。
// ABOUTME: 承認・Allowlist追加・HENKAKU送付は運営が手作業で行うことを明記する。
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitApplication } from "@/app/apply/actions";

export function ApplyForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication();
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "申請できませんでした");
      }
    });
  }

  return (
    <div>
      <p>
        申請すると運営メンバーが内容を確認し、Allowlist追加とHENKAKUの送付を手作業で行います。
      </p>
      <button type="button" disabled={pending} onClick={submit}>
        {pending ? "申請中…" : "申請する"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
