// ABOUTME: 署名したウォレットと操作中のウォレットのずれを判定する。
// ABOUTME: 画面から切り離して、比較と2つのガードだけをテストできる形にしている。
import type { Address } from "./types";

/**
 * 操作中のウォレットがサインイン済みのアドレスとずれていて、
 * サーバーのセッションを破棄すべきかどうか。
 *
 * `connectedAddress` は wagmi の `useAccount().address` をそのまま渡す。
 */
export function shouldDiscardSession({
  signedInAs,
  connectedAddress,
}: {
  signedInAs: Address | null;
  connectedAddress: string | undefined;
}): boolean {
  // 未サインインなら破棄するものがない。
  if (!signedInAs) return false;
  // ウォレット未接続では破棄しない。wagmi の再接続が終わるまでは address が
  // undefined を通るため、ここで破棄すると有効なセッションを消してしまう。
  if (!connectedAddress) return false;
  // セッション側は正規化済みの小文字、wagmi 側はチェックサム表記なので、
  // 揃えずに比較すると常に不一致になる(サインインした直後に破棄される)。
  return connectedAddress.toLowerCase() !== signedInAs;
}
