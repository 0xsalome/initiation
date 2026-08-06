// ABOUTME: shiniri 相当のウォレットセットアップ: Polygon 切替 → HENKAKU トークン追加。
// ABOUTME: watchAsset の成否は表示の補助情報であり、認証や完了条件にはしない。
"use client";

import { useAccount, useSwitchChain, useWatchAsset } from "wagmi";
import { polygon } from "wagmi/chains";
import { henkakuTokenConfig } from "@/lib/henkakuToken";

export function WalletSetup() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, error: switchError, isPending: switching } = useSwitchChain();
  const {
    watchAsset,
    data: watched,
    error: watchError,
    isPending: watching,
  } = useWatchAsset();

  if (!isConnected) return null;

  let token: ReturnType<typeof henkakuTokenConfig>;
  try {
    token = henkakuTokenConfig();
  } catch {
    return (
      <p role="alert">
        HENKAKU トークン設定がありません。NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS を設定してください。
      </p>
    );
  }

  const onPolygon = chainId === polygon.id;

  return (
    <ol>
      <li>
        {onPolygon ? (
          "Polygon に接続済み"
        ) : (
          <button
            type="button"
            disabled={switching}
            onClick={() => switchChain({ chainId: polygon.id })}
          >
            Polygon に切り替える
          </button>
        )}
        {switchError && (
          <p role="alert">切り替えできませんでした。もう一度お試しください。</p>
        )}
      </li>
      <li>
        <button
          type="button"
          disabled={!onPolygon || watching}
          onClick={() =>
            watchAsset({
              type: "ERC20",
              options: {
                address: token.address,
                symbol: token.symbol,
                decimals: token.decimals,
                image: token.image,
              },
            })
          }
        >
          HENKAKU トークンをウォレットに追加
        </button>
        {watched && (
          <p>追加リクエストを送りました（表示されない場合も進行に影響はありません）</p>
        )}
        {watchError && <p role="alert">追加できませんでした。スキップしても構いません。</p>}
      </li>
    </ol>
  );
}
