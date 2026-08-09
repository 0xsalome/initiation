// ABOUTME: 遷移履歴から field ごとの最新の理由を取り出すロジックを検証する。
// ABOUTME: 理由なしの遷移を拾わないこと、後の理由が前を隠さないことを固定する。
import { describe, expect, it } from "vitest";
import { latestReasonsByApplication } from "@/lib/domain/applicationEvents";
import type { Address, ApplicationEvent, StatusField } from "@/lib/domain/types";

const ACTOR = `0x${"22".repeat(20)}` as Address;

function event(overrides: Partial<ApplicationEvent> & { field: StatusField }): ApplicationEvent {
  return {
    id: `e-${Math.round(Date.parse(overrides.createdAt ?? "2026-08-09T00:00:00Z"))}-${overrides.field}`,
    applicationId: "a1",
    fromStatus: "pending",
    toStatus: "failed",
    actorAddress: ACTOR,
    reason: null,
    txId: null,
    createdAt: "2026-08-09T00:00:00Z",
    ...overrides,
  };
}

describe("latestReasonsByApplication", () => {
  it("returns nothing for an empty history", () => {
    expect(latestReasonsByApplication([])).toEqual(new Map());
  });

  it("keeps the reason of each field separate", () => {
    const reasons = latestReasonsByApplication([
      event({ field: "review", toStatus: "rejected", reason: "チェックイン履歴がない", createdAt: "2026-08-09T01:00:00Z" }),
      event({ field: "allowlist", toStatus: "failed", reason: "ガス不足でrevert", createdAt: "2026-08-09T02:00:00Z" }),
    ]);

    expect(reasons.get("a1")?.review?.reason).toBe("チェックイン履歴がない");
    expect(reasons.get("a1")?.allowlist?.reason).toBe("ガス不足でrevert");
    expect(reasons.get("a1")?.distribution).toBeUndefined();
  });

  it("takes the newest reason within a field", () => {
    const reasons = latestReasonsByApplication([
      event({ field: "allowlist", reason: "1回目: nonce競合", createdAt: "2026-08-09T01:00:00Z" }),
      event({ field: "allowlist", reason: "2回目: ガス不足", createdAt: "2026-08-09T03:00:00Z" }),
    ]);

    expect(reasons.get("a1")?.allowlist?.reason).toBe("2回目: ガス不足");
  });

  it("does not depend on the order it receives events in", () => {
    const newest = event({ field: "review", reason: "新しい", createdAt: "2026-08-09T05:00:00Z" });
    const oldest = event({ field: "review", reason: "古い", createdAt: "2026-08-09T01:00:00Z" });

    expect(latestReasonsByApplication([oldest, newest]).get("a1")?.review?.reason).toBe("新しい");
    expect(latestReasonsByApplication([newest, oldest]).get("a1")?.review?.reason).toBe("新しい");
  });

  it("ignores transitions recorded without a reason", () => {
    const reasons = latestReasonsByApplication([
      event({ field: "review", toStatus: "approved", reason: null, createdAt: "2026-08-09T04:00:00Z" }),
      event({ field: "review", toStatus: "needs_info", reason: "本人確認が必要", createdAt: "2026-08-09T02:00:00Z" }),
    ]);

    // 承認には理由を必須にしていないので、理由のない承認が却下理由を隠してはいけない。
    expect(reasons.get("a1")?.review?.reason).toBe("本人確認が必要");
  });

  it("groups by application", () => {
    const reasons = latestReasonsByApplication([
      event({ applicationId: "a1", field: "review", reason: "a1の理由" }),
      event({ applicationId: "a2", field: "review", reason: "a2の理由" }),
    ]);

    expect(reasons.get("a1")?.review?.reason).toBe("a1の理由");
    expect(reasons.get("a2")?.review?.reason).toBe("a2の理由");
  });
});
