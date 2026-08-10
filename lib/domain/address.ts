// ABOUTME: ウォレットアドレスの正規化。保存・比較の前に必ずこれを通す。
// ABOUTME: EVMアドレス形式を検証し、比較可能な小文字表現を返す。
import { isAddress } from "viem";
import type { Address } from "./types";

export function normalizeAddress(address: string): Address {
  if (!isAddress(address, { strict: false })) throw new Error(`invalid address: ${address}`);
  return address.toLowerCase() as Address;
}

/**
 * 表示用の短縮。先頭6文字と末尾4文字を残し、別のアドレスと見分けられるようにする。
 * 完全な値が必要な場面では title 属性などで併記する。
 */
export function shortenAddress(address: Address): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
