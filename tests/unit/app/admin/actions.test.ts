// ABOUTME: 管理者用状態遷移Actionの認可・遷移検証・監査情報委譲を検証する。
// ABOUTME: 不正な遷移や配布tx未入力ではRepositoryを書き換えないことを確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address, Application } from "@/lib/domain/types";

const {
  transitionMock,
  listAllMock,
  requireAdminMock,
  consumeMock,
  MockForbiddenError,
  MockUnauthenticatedError,
  MockConcurrentTransitionError,
} = vi.hoisted(() => {
  class MockForbiddenError extends Error {}
  class MockUnauthenticatedError extends Error {}
  class MockConcurrentTransitionError extends Error {}
  return {
    transitionMock: vi.fn(),
    listAllMock: vi.fn(),
    requireAdminMock: vi.fn(),
    consumeMock: vi.fn(),
    MockForbiddenError,
    MockUnauthenticatedError,
    MockConcurrentTransitionError,
  };
});

vi.mock("@/lib/repositories", () => ({
  getRepositories: () => ({
    applications: { transition: transitionMock, listAll: listAllMock },
    rateLimits: { consume: consumeMock },
  }),
  ConcurrentTransitionError: MockConcurrentTransitionError,
}));

vi.mock("@/lib/auth/guards", () => ({
  requireAdmin: requireAdminMock,
  ForbiddenError: MockForbiddenError,
  UnauthenticatedError: MockUnauthenticatedError,
}));

import { transitionApplication } from "@/app/admin/actions";

const ADMIN_ADDR = `0x${"22".repeat(20)}` as Address;

function application(
  overrides: Partial<Application> = {},
): Application & { walletAddress: Address; displayName: null } {
  return {
    id: "a1",
    memberId: "m1",
    reviewStatus: "pending",
    allowlistStatus: "pending",
    distributionStatus: "pending",
    distributionTxId: null,
    reason: null,
    createdAt: "t",
    updatedAt: "t",
    walletAddress: `0x${"11".repeat(20)}`,
    displayName: null,
    ...overrides,
  };
}

describe("transitionApplication", () => {
  beforeEach(() => {
    transitionMock.mockReset();
    listAllMock.mockReset();
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ address: ADMIN_ADDR });
    consumeMock.mockReset();
    consumeMock.mockResolvedValue(true);
  });

  it("applies a valid review transition with actor recorded", async () => {
    listAllMock.mockResolvedValue([application()]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "review",
      toStatus: "approved",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: "a1",
        field: "review",
        toStatus: "approved",
        actorAddress: ADMIN_ADDR,
      }),
    );
  });

  it("rejects an invalid transition without touching the repository", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "rejected" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "review",
      toStatus: "approved",
    });

    expect(result.ok).toBe(false);
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("requires txId when marking distribution as sent", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "distribution",
      toStatus: "sent",
    });

    expect(result).toEqual({ ok: false, error: "トランザクションIDを入力してください" });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("passes a valid allowlist transition with the admin actor", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "added",
      reason: "コントラクト側で追加を確認",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "added",
      expectedStatus: "pending",
      actorAddress: ADMIN_ADDR,
      reason: "コントラクト側で追加を確認",
      txId: undefined,
    });
  });

  it("trims a distribution tx hash before recording it", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "distribution",
      toStatus: "sent",
      txId: "  0xabc123  ",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith({
      applicationId: "a1",
      field: "distribution",
      toStatus: "sent",
      expectedStatus: "pending",
      actorAddress: ADMIN_ADDR,
      reason: undefined,
      txId: "0xabc123",
    });
  });

  it("passes the validated status as expectedStatus for conditional update", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "needs_info" })]);

    await transitionApplication({
      applicationId: "a1",
      field: "review",
      toStatus: "approved",
    });

    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({ field: "review", expectedStatus: "needs_info" }),
    );
  });

  it("reports a reload prompt when another admin transitioned first", async () => {
    listAllMock.mockResolvedValue([application()]);
    transitionMock.mockRejectedValueOnce(new MockConcurrentTransitionError());

    const result = await transitionApplication({
      applicationId: "a1",
      field: "review",
      toStatus: "approved",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("再読み込み");
  });

  it("requires a reason when recording an allowlist failure", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "failed",
    });

    expect(result).toEqual({ ok: false, error: "失敗理由を入力してください" });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only failure reason", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "distribution",
      toStatus: "failed",
      reason: "   ",
    });

    expect(result).toEqual({ ok: false, error: "失敗理由を入力してください" });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("records an allowlist failure with the trimmed reason", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "failed",
      reason: "  ガス不足でrevert  ",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        field: "allowlist",
        toStatus: "failed",
        reason: "ガス不足でrevert",
        actorAddress: ADMIN_ADDR,
      }),
    );
  });

  it("records a distribution failure with the reason", async () => {
    listAllMock.mockResolvedValue([application({ reviewStatus: "approved" })]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "distribution",
      toStatus: "failed",
      reason: "Safeの署名が集まらず期限切れ",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        field: "distribution",
        toStatus: "failed",
        reason: "Safeの署名が集まらず期限切れ",
      }),
    );
  });

  it("keeps a recorded failure recoverable to the completed status", async () => {
    listAllMock.mockResolvedValue([
      application({ reviewStatus: "approved", allowlistStatus: "failed" }),
    ]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "added",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({ field: "allowlist", toStatus: "added" }),
    );
  });

  // 再試行がまた失敗したときの理由を残せるようにする(Issue #20)。
  // 遷移前の値が failed なので expectedStatus も failed になる。
  it("records a repeated failure with the new reason", async () => {
    listAllMock.mockResolvedValue([
      application({ reviewStatus: "approved", allowlistStatus: "failed" }),
    ]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "allowlist",
      toStatus: "failed",
      reason: "2回目: nonceが競合した",
    });

    expect(result).toEqual({ ok: true });
    expect(transitionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        field: "allowlist",
        toStatus: "failed",
        expectedStatus: "failed",
        reason: "2回目: nonceが競合した",
      }),
    );
  });

  it("still requires a reason for a repeated failure", async () => {
    listAllMock.mockResolvedValue([
      application({ reviewStatus: "approved", distributionStatus: "failed" }),
    ]);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "distribution",
      toStatus: "failed",
    });

    expect(result).toEqual({ ok: false, error: "失敗理由を入力してください" });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("returns an error for an unknown application id", async () => {
    listAllMock.mockResolvedValue([]);

    const result = await transitionApplication({
      applicationId: "nope",
      field: "review",
      toStatus: "approved",
    });

    expect(result).toEqual({ ok: false, error: "申請が見つかりません" });
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("stops the call before loading applications when rate limited", async () => {
    consumeMock.mockResolvedValue(false);

    const result = await transitionApplication({
      applicationId: "a1",
      field: "review",
      toStatus: "approved",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("申請の状態更新が多すぎます");
    // 一覧の取得は全申請を読むため、上限に達した呼び出しはそこへ届かせない。
    expect(listAllMock).not.toHaveBeenCalled();
    expect(transitionMock).not.toHaveBeenCalled();
  });

  it("counts the attempt against the acting admin address", async () => {
    listAllMock.mockResolvedValue([application()]);

    await transitionApplication({ applicationId: "a1", field: "review", toStatus: "approved" });

    expect(consumeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "application_transition",
        subject: ADMIN_ADDR,
        limit: 120,
      }),
    );
  });

  it("returns a permission error for non-admin callers", async () => {
    requireAdminMock.mockRejectedValueOnce(new MockForbiddenError());

    expect(
      await transitionApplication({ applicationId: "a1", field: "review", toStatus: "approved" }),
    ).toEqual({ ok: false, error: "権限がありません" });
    expect(listAllMock).not.toHaveBeenCalled();
  });

  it("returns a permission error for unauthenticated callers", async () => {
    requireAdminMock.mockRejectedValueOnce(new MockUnauthenticatedError());

    expect(
      await transitionApplication({ applicationId: "a1", field: "review", toStatus: "approved" }),
    ).toEqual({ ok: false, error: "権限がありません" });
  });

  it("propagates repository failures", async () => {
    listAllMock.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(
      transitionApplication({ applicationId: "a1", field: "review", toStatus: "approved" }),
    ).rejects.toThrow("database unavailable");
  });
});
