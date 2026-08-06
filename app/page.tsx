import { ConnectWallet } from "@/components/ConnectWallet";
import { SignInWithEthereum } from "@/components/SignInWithEthereum";
import { WalletSetup } from "@/components/WalletSetup";

export default function Home() {
  return (
    <main>
      <ConnectWallet />
      <SignInWithEthereum />
      <WalletSetup />
    </main>
  );
}
