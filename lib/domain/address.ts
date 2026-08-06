// ABOUTME: ウォレットアドレスの正規化。保存・比較の前に必ずこれを通す。
// ABOUTME: EVMアドレス形式を検証し、比較可能な小文字表現を返す。
import { isAddress } from "viem";
import type { Address } from "./types";

export function normalizeAddress(address: string): Address {
  if (!isAddress(address, { strict: false })) throw new Error(`invalid address: ${address}`);
  return address.toLowerCase() as Address;
}
