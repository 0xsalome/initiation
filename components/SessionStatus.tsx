// ABOUTME: ヘッダーに出すサインイン状態・サインアウト・運営導線。
// ABOUTME: 表示はサーバーのセッションから決め、権限のない導線を出さない(Issue #40)。
"use client";

import Link from "next/link";
import { useState } from "react";
import { shortenAddress } from "@/lib/domain/address";
import { adminNavigation } from "@/lib/navigation";
import { buttonStyles } from "@/lib/ui";
import { useRefreshSession, useSession } from "@/lib/useSession";

export function SessionStatus() {
  const { data: session, isPending } = useSession();
  const refreshSession = useRefreshSession();
  const [signingOut, setSigningOut] = useState(false);

  // セッションを確かめる前は何も出さない。未サインインの表示を一瞬見せてから
  // 差し替えると、サインイン済みの人には状態が揺れて見えるため。
  if (isPending || !session) return null;

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refreshSession();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      {session.isAdmin &&
        adminNavigation.map((item) => (
          <li key={item.href}>
            <Link
              className="inline-flex min-h-9 items-center rounded-lg border border-border px-2.5 py-2 text-sm font-semibold text-muted transition hover:bg-surface-hover hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      <li>
        <span
          className="inline-flex min-h-9 items-center rounded-lg px-2.5 py-2 font-mono text-xs text-muted"
          title={session.address}
        >
          {shortenAddress(session.address)}
        </span>
      </li>
      <li>
        <button className={buttonStyles.quiet} type="button" disabled={signingOut} onClick={signOut}>
          {signingOut ? "サインアウト中…" : "サインアウト"}
        </button>
      </li>
    </>
  );
}
