// ABOUTME: 申請者向け状態ラベルの表示を検証する。
// ABOUTME: failedがpendingと区別され、失敗の詳細を出さないことを確認する。
import { describe, expect, it } from "vitest";
import { allowlistLabel, distributionLabel, reviewLabel } from "@/lib/applicationLabels";

describe("allowlistLabel", () => {
  it("distinguishes failed from pending", () => {
    expect(allowlistLabel("pending")).toBe("未実施");
    expect(allowlistLabel("failed")).toBe("運営が対応中です");
    expect(allowlistLabel("added")).toBe("追加済み");
    expect(allowlistLabel("failed")).not.toBe(allowlistLabel("pending"));
  });
});

describe("distributionLabel", () => {
  it("distinguishes failed from pending", () => {
    expect(distributionLabel("pending", null)).toBe("未実施");
    expect(distributionLabel("failed", null)).toBe("運営が対応中です");
    expect(distributionLabel("failed", null)).not.toBe(distributionLabel("pending", null));
  });

  it("shows the transaction id once sent", () => {
    expect(distributionLabel("sent", "0xabc")).toBe("送付済み (tx: 0xabc)");
    expect(distributionLabel("sent", null)).toBe("送付済み (tx: 記録なし)");
  });

  it("does not expose failure details to the applicant", () => {
    expect(distributionLabel("failed", "0xabc")).not.toContain("0xabc");
    expect(distributionLabel("failed", null)).not.toContain("失敗");
  });
});

describe("reviewLabel", () => {
  it("covers every review status", () => {
    expect(reviewLabel.pending).toBe("審査待ち");
    expect(reviewLabel.approved).toBe("承認済み");
    expect(reviewLabel.needs_info).toContain("追加情報");
    expect(reviewLabel.rejected).toBe("見送りになりました");
  });
});
