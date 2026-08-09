// ABOUTME: HENKAKU トークン設定を環境変数から安全に組み立てる契約を確認する。
// ABOUTME: 必須アドレスの欠落と不正な形式を受け入れないことを固定する。
import { readFileSync } from "node:fs";
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

  // .env.example をコピーしただけで /setup が動くことがIssue #2の要件なので、
  // 既定値そのものが検証を通ることを固定する。
  it("accepts the defaults shipped in .env.example", () => {
    const defaults = parseEnvFile(".env.example");
    for (const key of [
      "NEXT_PUBLIC_HENKAKU_TOKEN_ADDRESS",
      "NEXT_PUBLIC_HENKAKU_TOKEN_SYMBOL",
      "NEXT_PUBLIC_HENKAKU_TOKEN_DECIMALS",
      "NEXT_PUBLIC_HENKAKU_TOKEN_LOGO_URL",
    ] as const) {
      expect(defaults[key], `${key} must have a default in .env.example`).toBeTruthy();
      process.env[key] = defaults[key];
    }

    expect(henkakuTokenConfig()).toEqual({
      address: "0x0cc91a5FFC2E9370eC565Ab42ECE33bbC08C11a2",
      symbol: "HENKAKU",
      decimals: 18,
      image: "https://raw.githubusercontent.com/henkaku-center/omise-interface/main/public/henkakuToken.png",
    });
  });
});

function parseEnvFile(path: string): Record<string, string> {
  const entries = readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)] as const;
    });
  return Object.fromEntries(entries);
}
