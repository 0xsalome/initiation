// ABOUTME: SIWE サインイン。アカウント/チェーン変更を検知したらサーバーセッションを破棄する。
// ABOUTME: MetaMask の署名拒否は再試行できる画面エラーとして扱う。
"use client";

import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";
import { polygon } from "wagmi/chains";

export function SignInWithEthereum() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signedInAs && (address !== signedInAs || chainId !== polygon.id)) {
      void (async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          setSignedInAs(null);
        }
      })();
    }
  }, [address, chainId, signedInAs]);

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
      setSignedInAs(address!);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "署名がキャンセルされました");
    }
  }

  if (!address) return null;
  if (signedInAs) return <p>サインイン済み: {signedInAs}</p>;

  return (
    <div>
      <button onClick={signIn}>署名してサインイン</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
