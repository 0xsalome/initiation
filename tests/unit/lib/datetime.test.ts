// ABOUTME: 日時整形がJST固定であることを検証する。
// ABOUTME: 実行環境のタイムゾーンに引きずられると、SSRとブラウザで表示が食い違う。
import { describe, expect, it } from "vitest";
import { formatJst } from "@/lib/datetime";

describe("formatJst", () => {
  it("renders an instant in JST regardless of the runtime timezone", () => {
    // 2026-08-10T00:30:00Z は JST では同日 09:30。
    expect(formatJst("2026-08-10T00:30:00Z")).toBe("2026/8/10 9:30:00");
  });

  it("keeps the JST calendar date when UTC has already moved on", () => {
    // UTCでは8/9の15:00だが、JSTでは8/10へ日付が変わっている。
    expect(formatJst("2026-08-09T15:00:00Z")).toBe("2026/8/10 0:00:00");
  });
});
