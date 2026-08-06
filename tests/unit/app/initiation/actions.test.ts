// ABOUTME: Initiation進捗Server Actionの入力検証とRepository委譲を検証する。
// ABOUTME: 認証済みmemberへの保存と完走判定の境界を確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveMock, requireMemberMock, MockUnauthenticatedError } = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {}
  return {
    saveMock: vi.fn(),
    requireMemberMock: vi.fn(),
    MockUnauthenticatedError,
  };
});

vi.mock("@/lib/repositories", () => ({
  getRepositories: () => ({
    progress: { save: saveMock, listByMember: vi.fn().mockResolvedValue([]) },
  }),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireMember: requireMemberMock,
  UnauthenticatedError: MockUnauthenticatedError,
}));

import { saveStep } from "@/app/initiation/actions";
import { isInitiationComplete } from "@/lib/initiation/complete";
import { initiationSteps } from "@/lib/initiation/content";

describe("saveStep", () => {
  beforeEach(() => {
    saveMock.mockReset();
    requireMemberMock.mockReset();
    requireMemberMock.mockResolvedValue({ id: "m1", walletAddress: "0x" + "11".repeat(20) });
  });

  it("saves an answer for a question step", async () => {
    const result = await saveStep("q-introduction", "AIとハードウェアをやりたい");
    expect(result.ok).toBe(true);
    expect(saveMock).toHaveBeenCalledWith("m1", "q-introduction", "AIとハードウェアをやりたい");
  });

  it("rejects an unknown step id", async () => {
    const result = await saveStep("no-such-step", "x");
    expect(result.ok).toBe(false);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("rejects an empty answer for a question step", async () => {
    const result = await saveStep("q-introduction", "   ");
    expect(result.ok).toBe(false);
  });

  it("accepts null answer for a quest step (completion mark)", async () => {
    const result = await saveStep("quest-discord-hello", null);
    expect(result.ok).toBe(true);
    expect(saveMock).toHaveBeenCalledWith("m1", "quest-discord-hello", null);
  });

  it("returns an authentication error when the member is not signed in", async () => {
    requireMemberMock.mockRejectedValueOnce(new MockUnauthenticatedError());
    const result = await saveStep("q-introduction", "回答");
    expect(result).toEqual({ ok: false, error: "サインインしてください" });
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("propagates repository failures for the server error boundary", async () => {
    saveMock.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(saveStep("q-introduction", "回答")).rejects.toThrow("database unavailable");
  });
});

describe("isInitiationComplete", () => {
  it("is complete only when every step has an entry", () => {
    const all = initiationSteps.map((step) => ({ stepId: step.id, answer: "x", completedAt: "t" }));
    expect(isInitiationComplete(all)).toBe(true);
    expect(isInitiationComplete(all.slice(1))).toBe(false);
    expect(isInitiationComplete([])).toBe(false);
  });

  it("ignores duplicate and unknown entries when every defined step is complete", () => {
    const all = initiationSteps.map((step) => ({ stepId: step.id, answer: null, completedAt: "t" }));
    expect(
      isInitiationComplete([
        ...all,
        all[0],
        { stepId: "unknown-step", answer: null, completedAt: "t" },
      ]),
    ).toBe(true);
  });
});
