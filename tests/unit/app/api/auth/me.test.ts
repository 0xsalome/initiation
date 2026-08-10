// ABOUTME: セッション確認エンドポイントの応答を検証する。
// ABOUTME: 未認証は401、認証済みは正規化済みアドレスと自分の管理者判定だけを返す。
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));

import { GET } from "@/app/api/auth/me/route";

const ADMIN = "0xAAA1111111111111111111111111111111111111";
const MEMBER = "0xccc3333333333333333333333333333333333333";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    process.env.ADMIN_ADDRESSES = ADMIN;
  });

  it("returns 401 when the session has no address", async () => {
    getSessionMock.mockResolvedValue({});

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("reports isAdmin for an admin session", async () => {
    getSessionMock.mockResolvedValue({ address: ADMIN });

    const response = await GET();

    expect(response.status).toBe(200);
    // アドレスは比較可能な小文字で返す(画面側の突き合わせがこれに依存する)。
    expect(await response.json()).toEqual({ address: ADMIN.toLowerCase(), isAdmin: true });
  });

  it("reports isAdmin false for a member session", async () => {
    getSessionMock.mockResolvedValue({ address: MEMBER });

    const response = await GET();

    expect(await response.json()).toEqual({ address: MEMBER, isAdmin: false });
  });

  // 返すのは要求者自身の権限だけ。管理者の一覧を漏らさない。
  it("does not expose the admin allowlist", async () => {
    process.env.ADMIN_ADDRESSES = `${ADMIN},0xbbb2222222222222222222222222222222222222`;
    getSessionMock.mockResolvedValue({ address: MEMBER });

    const body = await (await GET()).text();

    expect(body).not.toContain("0xbbb2222222222222222222222222222222222222");
    expect(body).not.toContain(ADMIN.toLowerCase());
  });
});
