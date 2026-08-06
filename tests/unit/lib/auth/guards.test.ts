// ABOUTME: member/admin認可ガードの認証状態とallowlist境界を検証する。
// ABOUTME: セッションの正規化、未認証、非管理者拒否、管理者許可を確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, requireAdmin, requireMember, UnauthenticatedError } from "@/lib/auth/guards";

const { getSessionMock, findByAddressMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findByAddressMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/repositories", () => ({
  getRepositories: () => ({ members: { findByAddress: findByAddressMock } }),
}));

const ADMIN = "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa";
const MEMBER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("requireMember", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    findByAddressMock.mockReset();
    process.env.ADMIN_ADDRESSES = "";
  });

  it("rejects a session without an address", async () => {
    getSessionMock.mockResolvedValue({});
    await expect(requireMember()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(findByAddressMock).not.toHaveBeenCalled();
  });

  it("rejects an address that has no member record", async () => {
    getSessionMock.mockResolvedValue({ address: ADMIN });
    findByAddressMock.mockResolvedValue(null);
    await expect(requireMember()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(findByAddressMock).toHaveBeenCalledWith(ADMIN.toLowerCase());
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    findByAddressMock.mockReset();
    process.env.ADMIN_ADDRESSES = ADMIN;
    getSessionMock.mockResolvedValue({ address: MEMBER });
    findByAddressMock.mockResolvedValue({ id: "m1", walletAddress: MEMBER });
  });

  it("rejects a signed-in member outside the admin allowlist", async () => {
    await expect(requireAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("returns the normalized member and address for an admin", async () => {
    getSessionMock.mockResolvedValue({ address: ADMIN });
    findByAddressMock.mockResolvedValue({ id: "m-admin", walletAddress: ADMIN.toLowerCase() });
    const result = await requireAdmin();
    expect(result).toMatchObject({
      address: ADMIN.toLowerCase(),
      member: { id: "m-admin", walletAddress: ADMIN.toLowerCase() },
    });
    expect(findByAddressMock).toHaveBeenCalledWith(ADMIN.toLowerCase());
  });
});
