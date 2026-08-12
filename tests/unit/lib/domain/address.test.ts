// ABOUTME: アドレス正規化の入力境界を検証する。
// ABOUTME: checksummed addressの小文字化と不正形式の拒否を確認する。
import { describe, expect, it } from "vitest";
import { normalizeAddress, shortenAddress } from "@/lib/domain/address";
import type { Address } from "@/lib/domain/types";

describe("normalizeAddress", () => {
  it("lowercases a checksummed address", () => {
    expect(normalizeAddress("0xAbCd567890123456789012345678901234567890"))
      .toBe("0xabcd567890123456789012345678901234567890");
  });

  it("throws on a non-address string", () => {
    expect(() => normalizeAddress("hello")).toThrow(/address/i);
  });

  it("throws on wrong length", () => {
    expect(() => normalizeAddress("0x1234")).toThrow(/address/i);
  });
});

describe("shortenAddress", () => {
  it("keeps both ends so different addresses stay distinguishable", () => {
    expect(shortenAddress(normalizeAddress(`0x${"11".repeat(19)}ab`))).toBe("0x1111…11ab");
    expect(shortenAddress(normalizeAddress(`0x${"11".repeat(19)}cd`))).toBe("0x1111…11cd");
  });

  // normalizeAddress を通らない短い値は本来入ってこないが、短縮側で潰さないことを固定する。
  it("leaves a value that is already short alone", () => {
    expect(shortenAddress("0x1234" as Address)).toBe("0x1234");
  });
});
