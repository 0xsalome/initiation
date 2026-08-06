// ABOUTME: wagmi v2 の共有設定。Polygon 単一チェーン + injected(MetaMask 基準)。
// ABOUTME: ウォレット操作で使うチェーンとトランスポートを一箇所に定義する。
import { createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [injected()],
  transports: { [polygon.id]: http() },
});
