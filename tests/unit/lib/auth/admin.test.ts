// ABOUTME: 管理者ウォレットallowlistの比較ルールを検証する。
// ABOUTME: 大文字小文字・空白の正規化と空設定時の拒否を確認する。
import { beforeEach, describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/domain/address";
import { isAdminAddress } from "@/lib/auth/admin";

describe("isAdminAddress", () => {
  beforeEach(() => {
    process.env.ADMIN_ADDRESSES =
      "0xAAA1111111111111111111111111111111111111, 0xbbb2222222222222222222222222222222222222";
  });

  it("matches regardless of case and whitespace", () => {
    expect(isAdminAddress(normalizeAddress("0xaaa1111111111111111111111111111111111111"))).toBe(true);
    expect(isAdminAddress(normalizeAddress("0xBBB2222222222222222222222222222222222222"))).toBe(true);
  });

  it("rejects a non-admin address", () => {
    expect(isAdminAddress(normalizeAddress("0xccc3333333333333333333333333333333333333"))).toBe(false);
  });

  it("returns false when env is empty", () => {
    process.env.ADMIN_ADDRESSES = "";
    expect(isAdminAddress(normalizeAddress("0xaaa1111111111111111111111111111111111111"))).toBe(false);
  });
});
