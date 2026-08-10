// ABOUTME: SIWE サインイン。アカウント/チェーン変更を検知したらサーバーセッションを破棄する。
// ABOUTME: MetaMask の署名拒否は再試行できる画面エラーとして扱う。
"use client";

import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";
import { polygon } from "wagmi/chains";
import { buttonStyles } from "@/lib/ui";
import { useRefreshSession, useSession } from "@/lib/useSession";

export function SignInWithEthereum() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  // 表示の根拠はサーバーのセッション。Reactの状態だけで持つと、再読み込みで
  // サインイン済みが消え、期限切れ後も「サインイン済み」と出てしまう(Issue #40)。
  const { data: session, isPending } = useSession();
  const refreshSession = useRefreshSession();
  const [error, setError] = useState<string | null>(null);

  // セッションのアドレスは正規化済みの小文字、wagmi 側はチェックサム表記なので、
  // そのまま比較すると常に不一致になる。
  const signedInAs = session?.address ?? null;
  const connectedMatchesSession =
    signedInAs !== null && address?.toLowerCase() === signedInAs;

  useEffect(() => {
    if (!signedInAs) return;
    // ウォレット未接続では何もしない。wagmi の再接続が終わる前は address が
    // undefined になるため、ここで破棄すると有効なセッションを消してしまう。
    if (!address) return;
    if (address.toLowerCase() === signedInAs && chainId === polygon.id) return;

    void (async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        await refreshSession();
      }
    })();
  }, [signedInAs, address, chainId, refreshSession]);

  async function signIn() {
    setError(null);
    try {
      const nonceResponse = await fetch("/api/auth/nonce");
      if (!nonceResponse.ok) throw new Error("nonce の発行に失敗しました");
      const { nonce } = (await nonceResponse.json()) as { nonce: string };

      const message = new SiweMessage({
        domain: window.location.host,
        address: address!,
        statement: "Sign in to HENKAKU Initiation",
        uri: window.location.origin,
        version: "1",
        chainId: polygon.id,
        nonce,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!response.ok) throw new Error("サーバー検証に失敗しました");
      await refreshSession();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "署名がキャンセルされました");
    }
  }

  if (!address) {
    return <p className="text-sm leading-6 text-muted">先にウォレットを接続してください。</p>;
  }
  if (isPending) {
    return <p className="text-sm leading-6 text-muted">サインイン状態を確認しています…</p>;
  }
  if (connectedMatchesSession) {
    return (
      <p className="break-all rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
        サインイン済み: {address}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button className={buttonStyles.primary} type="button" onClick={signIn}>
        署名してサインイン
      </button>
      {error && (
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
