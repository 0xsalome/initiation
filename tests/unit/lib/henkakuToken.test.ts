// ABOUTME: HENKAKU トークン設定を環境変数から安全に組み立てる契約を確認する。
// ABOUTME: 必須アドレスの欠落と不正な形式を受け入れないことを固定する。
import { beforeEach, describe, expect, it } from "vitest";
import { henkakuTokenConfig } from "@/lib/henkakuToken";

describe("henkakuTokenConfig", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS =
      "0x1234567890123456789012345678901234567890";
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL = "HENKAKU";
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS = "18";
    delete process.env.NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL;
  });

  it("builds config from env vars", () => {
    expect(henkakuTokenConfig()).toEqual({
      address: "0x1234567890123456789012345678901234567890",
      symbol: "HENKAKU",
      decimals: 18,
      image: undefined,
    });
  });

  it("throws when address is missing", () => {
    delete process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS;
    expect(() => henkakuTokenConfig()).toThrow(/HENKAKU_TOKEN_ADDRESS/);
  });

  it("throws when address is not a hex address", () => {
    process.env.NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS = "not-an-address";
    expect(() => henkakuTokenConfig()).toThrow(/address/i);
  });
});
