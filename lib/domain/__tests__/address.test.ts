// ABOUTME: アドレス正規化の入力境界を検証する。
// ABOUTME: checksummed addressの小文字化と不正形式の拒否を確認する。
import { describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/domain/address";

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
