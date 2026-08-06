// ABOUTME: チェックインServer Actionの結果変換と認証境界を検証する。
// ABOUTME: 初回・同日重複・未認証・Repository障害の扱いを確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkinTodayMock, requireMemberMock, MockUnauthenticatedError } = vi.hoisted(() => {
  class MockUnauthenticatedError extends Error {}
  return {
    checkinTodayMock: vi.fn(),
    requireMemberMock: vi.fn(),
    MockUnauthenticatedError,
  };
});

vi.mock("@/lib/repositories", () => ({
  getRepositories: () => ({
    checkins: { checkinToday: checkinTodayMock, listByMember: vi.fn() },
  }),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireMember: requireMemberMock,
  UnauthenticatedError: MockUnauthenticatedError,
}));

import { checkin } from "@/app/checkin/actions";

describe("checkin", () => {
  beforeEach(() => {
    checkinTodayMock.mockReset();
    requireMemberMock.mockReset();
    requireMemberMock.mockResolvedValue({ id: "m1" });
  });

  it("returns ok on first checkin of the day", async () => {
    checkinTodayMock.mockResolvedValue({ created: true, checkin: { id: "c1" } });
    expect(await checkin()).toEqual({ ok: true, alreadyCheckedIn: false });
    expect(checkinTodayMock).toHaveBeenCalledWith("m1");
  });

  it("reports already checked in on second call", async () => {
    checkinTodayMock.mockResolvedValue({ created: false, checkin: { id: "c1" } });
    expect(await checkin()).toEqual({ ok: true, alreadyCheckedIn: true });
  });

  it("returns an authentication error when the member is not signed in", async () => {
    requireMemberMock.mockRejectedValueOnce(new MockUnauthenticatedError());
    expect(await checkin()).toEqual({ ok: false, error: "サインインしてください" });
    expect(checkinTodayMock).not.toHaveBeenCalled();
  });

  it("propagates repository failures for the server error boundary", async () => {
    checkinTodayMock.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(checkin()).rejects.toThrow("database unavailable");
  });
});
