// ABOUTME: 新入り向けウォレットセットアップ導線を提供する。
// ABOUTME: 接続、SIWE、Polygon切替、HENKAKU追加を順番に案内する。
import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";
import { SignInWithEthereum } from "@/components/SignInWithEthereum";
import { WalletSetup } from "@/components/WalletSetup";

export default function SetupPage() {
  return (
    <main>
      <h1>ウォレットセットアップ</h1>
      <section>
        <h2>1. ウォレットを接続</h2>
        <ConnectWallet />
      </section>
      <section>
        <h2>2. 署名してサインイン</h2>
        <SignInWithEthereum />
      </section>
      <section>
        <h2>3. PolygonとHENKAKUトークン</h2>
        <WalletSetup />
      </section>
      <p>
        準備ができたら
        <Link className="primaryLink" href="/initiation">
          Initiationをはじめる →
        </Link>
      </p>
    </main>
  );
}
