// ABOUTME: 操作中のウォレットがサインイン済みのアドレスとずれたらセッションを破棄する。
// ABOUTME: 全ページで効かせるため、ルートレイアウトに乗る SessionStatus から呼ぶ(Issue #44)。
"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import type { Address } from "@/lib/domain/types";
import { shouldDiscardSession } from "@/lib/domain/walletSession";
import { useSignOut } from "@/lib/useSession";

/**
 * 見るのはアカウントのずれだけで、接続チェーンは見ない。
 *
 * チェーンまで全ページで見ると、Polygon への接続を前提にしない画面(`/checkin`
 * `/apply`)でネットワークを切り替えただけでサインアウトされてしまう。署名が
 * 証明しているのは「そのアドレスの持ち主であること」で、今つないでいる
 * ネットワークはその証明を無効にしない。Polygon が要る操作は `/setup` が扱う。
 */
export function useSignOutOnAccountChange(signedInAs: Address | null): void {
  const { address } = useAccount();
  const signOut = useSignOut();

  useEffect(() => {
    if (!shouldDiscardSession({ signedInAs, connectedAddress: address })) return;
    void signOut();
  }, [signedInAs, address, signOut]);
}
