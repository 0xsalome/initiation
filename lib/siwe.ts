// ABOUTME: SIWE メッセージ検証。nonce / domain / chainId / 署名をサーバー側で確認する。
// ABOUTME: 有効期限は SiweMessage の expirationTime があれば siwe ライブラリが検証する。
import { SiweMessage } from "siwe";

type VerifyParams = {
  message: string;
  signature: `0x${string}`;
  expectedNonce: string;
  expectedDomain: string;
  expectedChainId: number;
};

export async function verifySiweMessage(
  params: VerifyParams,
): Promise<{ ok: true; address: `0x${string}` } | { ok: false; reason: string }> {
  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(params.message);
  } catch {
    return { ok: false, reason: "malformed message" };
  }

  if (siwe.chainId !== params.expectedChainId) {
    return { ok: false, reason: "chainId mismatch" };
  }

  const result = await siwe
    .verify({
      signature: params.signature,
      nonce: params.expectedNonce,
      domain: params.expectedDomain,
    })
    .catch(() => ({ success: false as const }));

  if (!result.success) {
    return { ok: false, reason: "verification failed" };
  }

  return { ok: true, address: siwe.address as `0x${string}` };
}
