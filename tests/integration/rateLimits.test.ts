// ABOUTME: レート制限の数え上げをローカルSupabaseで検証する。
// ABOUTME: 上限・ウィンドウの巻き戻し・単位の独立と、同時呼び出しでの直列化を確認する。
import { beforeEach, describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/domain/address";
import { getRepositories } from "@/lib/repositories";
import { testClient, truncateAll } from "@/tests/support/repositories";

const SUBJECT = normalizeAddress("0x1111111111111111111111111111111111111111");
const OTHER = normalizeAddress("0x2222222222222222222222222222222222222222");

const rule = { bucket: "test_bucket", limit: 3, windowSeconds: 60 };

describe("rateLimits (local supabase)", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("allows calls up to the limit and blocks the rest", async () => {
    const { rateLimits } = getRepositories();
    const results = [];
    for (let i = 0; i < 4; i += 1) {
      results.push(await rateLimits.consume({ ...rule, subject: SUBJECT }));
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("counts each subject independently", async () => {
    const { rateLimits } = getRepositories();
    for (let i = 0; i < 3; i += 1) {
      await rateLimits.consume({ ...rule, subject: SUBJECT });
    }
    expect(await rateLimits.consume({ ...rule, subject: SUBJECT })).toBe(false);
    // 上限に達したメンバーが、他のメンバーを巻き込まないこと。
    expect(await rateLimits.consume({ ...rule, subject: OTHER })).toBe(true);
  });

  it("counts each bucket independently", async () => {
    const { rateLimits } = getRepositories();
    for (let i = 0; i < 3; i += 1) {
      await rateLimits.consume({ ...rule, subject: SUBJECT });
    }
    expect(await rateLimits.consume({ ...rule, subject: SUBJECT })).toBe(false);
    // 申請で詰まってもチェックインは通る、という分離。
    expect(
      await rateLimits.consume({ bucket: "other_bucket", subject: SUBJECT, limit: 3, windowSeconds: 60 }),
    ).toBe(true);
  });

  it("starts a fresh window once the previous one has elapsed", async () => {
    const { rateLimits } = getRepositories();
    for (let i = 0; i < 4; i += 1) {
      await rateLimits.consume({ ...rule, subject: SUBJECT });
    }
    expect(await rateLimits.consume({ ...rule, subject: SUBJECT })).toBe(false);

    // 時計を待たずにウィンドウ跨ぎを作る。
    const { error } = await testClient()
      .from("rate_limits")
      .update({ window_started_at: new Date(Date.now() - 61_000).toISOString() })
      .eq("bucket", rule.bucket)
      .eq("subject", SUBJECT);
    if (error) throw error;

    expect(await rateLimits.consume({ ...rule, subject: SUBJECT })).toBe(true);
  });

  it("does not exceed the limit when calls arrive concurrently", async () => {
    const { rateLimits } = getRepositories();
    // 読み取り→加算→書き込みを別々のSQLで行っていると、ここで上限を越える。
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        rateLimits.consume({ bucket: "concurrent", subject: SUBJECT, limit: 5, windowSeconds: 300 }),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});
