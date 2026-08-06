// ABOUTME: MetaMask(injected)接続ボタン。接続拒否は復帰可能なエラーとして表示する。
// ABOUTME: 接続済みのアドレスと切断操作を最小の UI で提供する。
"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p data-testid="address">{address}</p>
        <button onClick={() => disconnect()}>切断</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => connect({ connector: connectors[0] })}>
        ウォレットを接続
      </button>
      {error && <p role="alert">接続できませんでした: {error.message}</p>}
    </div>
  );
}
