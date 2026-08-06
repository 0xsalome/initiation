// ABOUTME: Vitest の最小実行確認。
// ABOUTME: アプリケーションのロジックではなくテスト基盤だけを検証する。
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
