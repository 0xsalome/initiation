// ABOUTME: 管理者用状態遷移Actionの認可・遷移検証・監査情報委譲を検証する。
// ABOUTME: 不正な遷移や配布tx未入力ではRepositoryを書き換えないことを確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address, Application } from "@/lib/domain/types";

const {
  transitionMock,
  listAllMock,
  requireAdminMock,
  MockForbiddenError,
  MockUnauthenticatedError,
} = vi.hoisted(() => {
  class MockForbiddenError extends Error {}
  class MockUnauthenticatedError extends Error {}
  return {
    transitionMock: vi.fn(),
    listAllMock: vi.fn(),
    requireAdminMock: vi.fn(),
    MockForbiddenError,
    MockUnauthenticatedError,
  };
});

vi.mock("@/lib/repositories", () => ({
  getRepositories: () => ({ applications: { transition: transitionMock, listAll: listAllMock } }),
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
      actorAddress: ADMIN_ADDR,
      reason: undefined,
      txId: "0xabc123",
    });
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
