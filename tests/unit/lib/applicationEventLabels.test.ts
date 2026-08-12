// ABOUTME: 運営向けの履歴表示ラベルを検証する。
// ABOUTME: 実行者アドレスの短縮は lib/domain/address.ts へ寄せたため、そちらのテストで固定する。
import { describe, expect, it } from "vitest";
import { fieldLabel } from "@/lib/applicationEventLabels";

describe("fieldLabel", () => {
  it("labels every status field", () => {
    expect(fieldLabel("review")).toBe("審査");
    expect(fieldLabel("allowlist")).toBe("Allowlist");
    expect(fieldLabel("distribution")).toBe("配布");
  });
});
