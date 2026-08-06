// ABOUTME: 申請ステータスの許可・拒否ルールを検証する。
// ABOUTME: 審査承認前の実行禁止と終端状態の保護を確認する。
import { describe, expect, it } from "vitest";
import { validateTransition } from "@/lib/domain/applicationTransitions";
import type { Application } from "@/lib/domain/types";

function app(overrides: Partial<Application> = {}): Application {
  return {
    id: "a1",
    memberId: "m1",
    reviewStatus: "pending",
    allowlistStatus: "pending",
    distributionStatus: "pending",
    distributionTxId: null,
    reason: null,
    createdAt: "2026-08-06T00:00:00Z",
    updatedAt: "2026-08-06T00:00:00Z",
    ...overrides,
  };
}

describe("validateTransition", () => {
  it("allows pending -> approved for review", () => {
    expect(validateTransition(app(), "review", "approved")).toEqual({ ok: true });
  });

  it("allows needs_info -> rejected for review", () => {
    expect(validateTransition(app({ reviewStatus: "needs_info" }), "review", "rejected")).toEqual({ ok: true });
  });

  it("forbids changing a rejected review", () => {
    expect(validateTransition(app({ reviewStatus: "rejected" }), "review", "approved").ok).toBe(false);
  });

  it("forbids allowlist change before approval", () => {
    expect(validateTransition(app(), "allowlist", "added").ok).toBe(false);
  });

  it("allows allowlist pending -> added after approval", () => {
    expect(validateTransition(app({ reviewStatus: "approved" }), "allowlist", "added")).toEqual({ ok: true });
  });

  it("allows distribution failed -> sent retry after approval", () => {
    expect(
      validateTransition(app({ reviewStatus: "approved", distributionStatus: "failed" }), "distribution", "sent"),
    ).toEqual({ ok: true });
  });

  it("forbids leaving a terminal sent state", () => {
    expect(
      validateTransition(app({ reviewStatus: "approved", distributionStatus: "sent" }), "distribution", "failed").ok,
    ).toBe(false);
  });

  it("rejects an unknown status value", () => {
    expect(validateTransition(app(), "review", "banana").ok).toBe(false);
  });
});
