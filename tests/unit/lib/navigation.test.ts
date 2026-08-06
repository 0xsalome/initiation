// ABOUTME: サイト共通メニューの順序・リンク先・表示名を検証する。
// ABOUTME: 新しいページを追加するときに導線が欠落しないよう、ナビゲーション契約を固定する。
import { describe, expect, it } from "vitest";
import { adminNavigation, mainNavigation } from "@/lib/navigation";

describe("site navigation", () => {
  it("presents the member flow in order", () => {
    expect(mainNavigation).toEqual([
      { href: "/setup", label: "セットアップ", step: "1" },
      { href: "/initiation", label: "Initiation", step: "2" },
      { href: "/checkin", label: "チェックイン", step: "3" },
      { href: "/apply", label: "申請", step: "4" },
    ]);
  });

  it("keeps the administration link separate from the member flow", () => {
    expect(adminNavigation).toEqual([{ href: "/admin", label: "運営" }]);
    expect(new Set([...mainNavigation, ...adminNavigation].map((item) => item.href)).size).toBe(5);
  });
});
