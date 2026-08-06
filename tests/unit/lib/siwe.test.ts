// ABOUTME: 実署名を使って SIWE 検証の境界条件を確認する。
// ABOUTME: nonce・domain・chainId・署名の不一致を受け入れない契約を固定する。
import { describe, it, expect } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SiweMessage } from "siwe";
import { verifySiweMessage } from "@/lib/siwe";

const DOMAIN = "localhost:3000";
const CHAIN_ID = 137;

async function buildSignedMessage(
  overrides: Partial<{ nonce: string; domain: string; chainId: number }> = {},
) {
  const pk = generatePrivateKey();
  const account = privateKeyToAccount(pk);
  const message = new SiweMessage({
    domain: overrides.domain ?? DOMAIN,
    address: account.address,
    statement: "Sign in to HENKAKU Initiation",
    uri: `http://${overrides.domain ?? DOMAIN}`,
    version: "1",
    chainId: overrides.chainId ?? CHAIN_ID,
    nonce: overrides.nonce ?? "abcdefgh12345678",
  }).prepareMessage();
  const signature = await account.signMessage({ message });
  return { message, signature, address: account.address };
}

describe("verifySiweMessage", () => {
  it("accepts a valid message signed by the address", async () => {
    const { message, signature, address } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message,
      signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result).toEqual({ ok: true, address });
  });

  it("rejects a nonce mismatch", async () => {
    const { message, signature } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message,
      signature,
      expectedNonce: "differentnonce00",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a domain mismatch", async () => {
    const { message, signature } = await buildSignedMessage({ domain: "evil.example.com" });
    const result = await verifySiweMessage({
      message,
      signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a chainId mismatch", async () => {
    const { message, signature } = await buildSignedMessage({ chainId: 1 });
    const result = await verifySiweMessage({
      message,
      signature,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const { message } = await buildSignedMessage();
    const result = await verifySiweMessage({
      message,
      signature: ("0x" + "ab".repeat(65)) as `0x${string}`,
      expectedNonce: "abcdefgh12345678",
      expectedDomain: DOMAIN,
      expectedChainId: CHAIN_ID,
    });
    expect(result.ok).toBe(false);
  });
});
