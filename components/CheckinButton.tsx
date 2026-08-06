// ABOUTME: チェックイン実行ボタン。同日2回目は「チェックイン済み」を表示する。
// ABOUTME: Server Action完了後に履歴を再取得して、画面に結果を反映する。
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { checkin } from "@/app/checkin/actions";
import { buttonStyles } from "@/lib/ui";

export function CheckinButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await checkin();
      if (!result.ok) {
        setMessage(result.error ?? "チェックインに失敗しました");
      } else if (result.alreadyCheckedIn) {
        setMessage("今日はチェックイン済みです");
      } else {
        setMessage("チェックインしました！");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
      <p className="text-sm font-semibold text-foreground">今日の参加を記録します。</p>
      <button className={`${buttonStyles.primary} mt-4`} type="button" disabled={pending} onClick={submit}>
        {pending ? "チェックイン中…" : "今日のチェックイン"}
      </button>
      {message && <p className="mt-3 text-sm font-semibold text-foreground" role="status">{message}</p>}
    </div>
  );
}
