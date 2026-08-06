// ABOUTME: Supabase Repositoryの主要な永続化境界を検証する。
// ABOUTME: 重複申請、監査イベント、日次チェックインをローカルDBで確認する。
import { beforeEach, describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/domain/address";
import { DuplicateApplicationError, getRepositories } from "@/lib/repositories";
import { testClient, truncateAll } from "@/tests/support/repositories";

const ADDR = normalizeAddress("0x1111111111111111111111111111111111111111");
const ADMIN = normalizeAddress("0x2222222222222222222222222222222222222222");

describe("repositories (local supabase)", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("upserts a member idempotently by address", async () => {
    const { members } = getRepositories();
    const first = await members.upsertByAddress(ADDR);
    const second = await members.upsertByAddress(ADDR);
    expect(second.id).toBe(first.id);
    expect(second.walletAddress).toBe(ADDR);
  });

  it("saves and overwrites progress per step", async () => {
    const { members, progress } = getRepositories();
    const m = await members.upsertByAddress(ADDR);
    await progress.save(m.id, "q1", "最初の回答");
    await progress.save(m.id, "q1", "書き直した回答");
    const entries = await progress.listByMember(m.id);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ stepId: "q1", answer: "書き直した回答" });
  });

  it("prevents duplicate active applications", async () => {
    const { members, applications } = getRepositories();
    const m = await members.upsertByAddress(ADDR);
    await applications.create(m.id);
    await expect(applications.create(m.id)).rejects.toBeInstanceOf(DuplicateApplicationError);
  });

  it("allows re-application after rejection", async () => {
    const { members, applications } = getRepositories();
    const m = await members.upsertByAddress(ADDR);
    const app = await applications.create(m.id);
    await applications.transition({
      applicationId: app.id,
      field: "review",
      toStatus: "rejected",
      actorAddress: ADMIN,
      reason: "情報不足",
    });
    const second = await applications.create(m.id);
    expect(second.id).not.toBe(app.id);
  });

  it("records an audit event on transition", async () => {
    const { members, applications } = getRepositories();
    const m = await members.upsertByAddress(ADDR);
    const app = await applications.create(m.id);
    await applications.transition({
      applicationId: app.id,
      field: "distribution",
      toStatus: "sent",
      actorAddress: ADMIN,
      reason: "Safeで送付完了を確認",
      txId: "0xdeadbeef",
    });
    const listed = await applications.listAll();
    expect(listed[0].distributionStatus).toBe("sent");
    expect(listed[0].distributionTxId).toBe("0xdeadbeef");
    const { data } = await testClient().from("application_events").select("*").eq("application_id", app.id);
    expect(data).toHaveLength(1);
    expect(data![0]).toMatchObject({
      field: "distribution",
      to_status: "sent",
      actor_address: ADMIN,
      reason: "Safeで送付完了を確認",
      tx_id: "0xdeadbeef",
    });
  });

  it("checks in once per day", async () => {
    const { members, checkins } = getRepositories();
    const m = await members.upsertByAddress(ADDR);
    const first = await checkins.checkinToday(m.id);
    const second = await checkins.checkinToday(m.id);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await checkins.listByMember(m.id)).toHaveLength(1);
  });
});
