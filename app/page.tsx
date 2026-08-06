import { ConnectWallet } from "@/components/ConnectWallet";
import { SignInWithEthereum } from "@/components/SignInWithEthereum";

export default function Home() {
  return (
    <main>
      <ConnectWallet />
      <SignInWithEthereum />
    </main>
  );
}
