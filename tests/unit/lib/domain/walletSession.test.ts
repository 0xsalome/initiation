// ABOUTME: ウォレットのずれ判定を検証する。
// ABOUTME: 有効なセッションを誤って破棄しないガード2つを固定する。
import { describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/domain/address";
import { shouldDiscardSession } from "@/lib/domain/walletSession";

const SIGNED_IN = normalizeAddress("0x1111111111111111111111111111111111111111");
const OTHER = "0x2222222222222222222222222222222222222222";

describe("shouldDiscardSession", () => {
  it("discards when the connected wallet is a different account", () => {
    expect(shouldDiscardSession({ signedInAs: SIGNED_IN, connectedAddress: OTHER })).toBe(true);
  });

  it("keeps the session when the connected wallet is checksummed", () => {
    // wagmi はチェックサム表記で返す。揃えずに比較すると常に不一致になり、
    // サインインした直後にサインアウトされる。
    const checksummed = "0xAbCd567890123456789012345678901234567890";
    expect(
      shouldDiscardSession({
        signedInAs: normalizeAddress(checksummed),
        connectedAddress: checksummed,
      }),
    ).toBe(false);
  });

  it("keeps the session while the wallet is not connected", () => {
    // wagmi の再接続が終わるまで address は undefined を通る。ここで破棄すると
    // 有効なセッションを消してしまう。
    expect(shouldDiscardSession({ signedInAs: SIGNED_IN, connectedAddress: undefined })).toBe(false);
  });

  it("does nothing when there is no session to discard", () => {
    expect(shouldDiscardSession({ signedInAs: null, connectedAddress: OTHER })).toBe(false);
  });
});
