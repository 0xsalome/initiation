// ABOUTME: 申請Server Actionの完走条件と重複・認証エラー変換を検証する。
// ABOUTME: 申請作成前にInitiation進捗を確認し、Repositoryへ正しいmemberを渡すことを確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initiationSteps } from "@/lib/initiation/content";

const { createMock, listByMemberMock, requireMemberMock, MockUnauthenticatedError } = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {}
  return {
    createMock: vi.fn(),
    listByMemberMock: vi.fn(),
    requireMemberMock: vi.fn(),
    MockUnauthenticatedError,
  };
});

vi.mock("@/lib/repositories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/repositories")>("@/lib/repositories");
  return {
    ...actual,
    getRepositories: () => ({
      applications: { create: createMock },
      progress: { listByMember: listByMemberMock },
    }),
  };
});

vi.mock("@/lib/auth/guards", () => ({
  requireMember: requireMemberMock,
  UnauthenticatedError: MockUnauthenticatedError,
}));

import { submitApplication } from "@/app/apply/actions";
import { DuplicateApplicationError } from "@/lib/repositories";

const allDone = initiationSteps.map((step) => ({
  stepId: step.id,
  answer: "x",
  completedAt: "t",
}));

describe("submitApplication", () => {
  beforeEach(() => {
    createMock.mockReset();
    listByMemberMock.mockReset();
    requireMemberMock.mockReset();
    requireMemberMock.mockResolvedValue({ id: "m1" });
  });

  it("creates an application when initiation is complete", async () => {
    listByMemberMock.mockResolvedValue(allDone);
    createMock.mockResolvedValue({ id: "a1" });

    expect(await submitApplication()).toEqual({ ok: true });
    expect(listByMemberMock).toHaveBeenCalledWith("m1");
    expect(createMock).toHaveBeenCalledWith("m1");
  });

  it("rejects when initiation is not complete", async () => {
    listByMemberMock.mockResolvedValue([]);

    const result = await submitApplication();

    expect(result).toEqual({ ok: false, error: "先に Initiation を完走してください" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("reports duplicate application as a user-facing error", async () => {
    listByMemberMock.mockResolvedValue(allDone);
    createMock.mockRejectedValue(new DuplicateApplicationError("dup"));

    const result = await submitApplication();

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/申請済み/);
  });

  it("returns an authentication error when the member is not signed in", async () => {
    requireMemberMock.mockRejectedValueOnce(new MockUnauthenticatedError());

    expect(await submitApplication()).toEqual({ ok: false, error: "サインインしてください" });
    expect(listByMemberMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("propagates repository failures for the server error boundary", async () => {
    listByMemberMock.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(submitApplication()).rejects.toThrow("database unavailable");
  });
});
