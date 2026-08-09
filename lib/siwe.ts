// ABOUTME: SIWE メッセージ検証。nonce / domain / uri / chainId / 有効期限 / 署名をサーバー側で確認する。
// ABOUTME: 期待ドメインは設定値(SIWE_ALLOWED_DOMAINS)から読み、リクエストのHostヘッダーは信用しない。
import { SiweMessage } from "siwe";

// クライアント(components/SignInWithEthereum.tsx)は10分の期限を入れる。
// 時計のずれを吸収する余裕を持たせつつ、それ以上長い期限のメッセージは受け付けない。
export const MAX_SIWE_LIFETIME_MS = 15 * 60 * 1000;

type VerifyParams = {
  message: string;
  signature: `0x${string}`;
  expectedNonce: string;
  allowedDomains: string[];
  expectedChainId: number;
  now?: Date;
};

export function parseAllowedDomains(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export async function verifySiweMessage(
  params: VerifyParams,
): Promise<{ ok: true; address: `0x${string}` } | { ok: false; reason: string }> {
  if (params.allowedDomains.length === 0) {
    return { ok: false, reason: "domain not configured" };
  }

  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(params.message);
  } catch {
    return { ok: false, reason: "malformed message" };
  }

  if (siwe.chainId !== params.expectedChainId) {
    return { ok: false, reason: "chainId mismatch" };
  }

  if (!params.allowedDomains.includes(siwe.domain.toLowerCase())) {
    return { ok: false, reason: "domain mismatch" };
  }

  // uri は署名対象に含まれるが siwe ライブラリは期待値と突き合わせない。
  // 許可済みの domain と同じホストを指していることを自前で確認する。
  let uri: URL;
  try {
    uri = new URL(siwe.uri);
  } catch {
    return { ok: false, reason: "uri mismatch" };
  }
  if (uri.protocol !== "http:" && uri.protocol !== "https:") {
    return { ok: false, reason: "uri mismatch" };
  }
  if (uri.host.toLowerCase() !== siwe.domain.toLowerCase()) {
    return { ok: false, reason: "uri mismatch" };
  }

  // メッセージを組み立てるのはクライアントなので、期限の有無をサーバー側で必須にする。
  if (!siwe.expirationTime) {
    return { ok: false, reason: "expiration required" };
  }
  const expiresAt = Date.parse(siwe.expirationTime);
  if (Number.isNaN(expiresAt)) {
    return { ok: false, reason: "expiration required" };
  }
  const nowDate = params.now ?? new Date();
  const now = nowDate.getTime();
  if (expiresAt <= now) {
    return { ok: false, reason: "expired" };
  }
  if (expiresAt - now > MAX_SIWE_LIFETIME_MS) {
    return { ok: false, reason: "expiration too long" };
  }

  const result = await siwe
    .verify({
      signature: params.signature,
      nonce: params.expectedNonce,
      domain: siwe.domain,
      time: nowDate.toISOString(),
    })
    .catch(() => ({ success: false as const }));

  if (!result.success) {
    return { ok: false, reason: "verification failed" };
  }

  return { ok: true, address: siwe.address as `0x${string}` };
}
