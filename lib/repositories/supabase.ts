// ABOUTME: RepositoriesのSupabase実装。snake_case行をcamelCaseドメイン型に変換する。
// ABOUTME: サーバー専用のservice_role接続でMVP-1の永続化操作を提供する。
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeAddress } from "@/lib/domain/address";
import type {
  Address,
  Application,
  ApplicationWithMember,
  Checkin,
  Member,
  ProgressEntry,
  StatusField,
} from "@/lib/domain/types";
import {
  DuplicateApplicationError,
  type ApplicationRepository,
  type CheckinRepository,
  type MemberRepository,
  type ProgressRepository,
  type Repositories,
} from "./index";

type Row = Record<string, unknown>;

function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key);
}

function toMember(row: Row): Member {
  return {
    id: row.id as string,
    walletAddress: row.wallet_address as Address,
    displayName: (row.display_name as string) ?? null,
    firstAuthenticatedAt: row.first_authenticated_at as string,
  };
}

const members: MemberRepository = {
  async findByAddress(address) {
    const normalizedAddress = normalizeAddress(address);
    const { data, error } = await client()
      .from("members")
      .select("*")
      .eq("wallet_address", normalizedAddress)
      .maybeSingle();
    if (error) throw error;
    return data ? toMember(data as Row) : null;
  },

  async upsertByAddress(address) {
    const normalizedAddress = normalizeAddress(address);
    const { data, error } = await client()
      .from("members")
      .upsert({ wallet_address: normalizedAddress }, { onConflict: "wallet_address" })
      .select()
      .single();
    if (error) throw error;
    return toMember(data as Row);
  },

  async updateDisplayName(memberId, displayName) {
    const { error } = await client()
      .from("members")
      .update({ display_name: displayName })
      .eq("id", memberId);
    if (error) throw error;
  },
};

const progress: ProgressRepository = {
  async listByMember(memberId) {
    const { data, error } = await client()
      .from("initiation_progress")
      .select("*")
      .eq("member_id", memberId)
      .order("completed_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const r = row as Row;
      return {
        stepId: r.step_id as string,
        answer: (r.answer as string) ?? null,
        completedAt: r.completed_at as string,
      } satisfies ProgressEntry;
    });
  },

  async save(memberId, stepId, answer) {
    const { error } = await client()
      .from("initiation_progress")
      .upsert(
        {
          member_id: memberId,
          step_id: stepId,
          answer,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "member_id,step_id" },
      );
    if (error) throw error;
  },
};

function toApplication(row: Row): Application {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    reviewStatus: row.review_status as Application["reviewStatus"],
    allowlistStatus: row.allowlist_status as Application["allowlistStatus"],
    distributionStatus: row.distribution_status as Application["distributionStatus"],
    distributionTxId: (row.distribution_tx_id as string) ?? null,
    reason: (row.reason as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const STATUS_COLUMN: Record<StatusField, string> = {
  review: "review_status",
  allowlist: "allowlist_status",
  distribution: "distribution_status",
};

const applications: ApplicationRepository = {
  async findActiveByMember(memberId) {
    const { data, error } = await client()
      .from("applications")
      .select("*")
      .eq("member_id", memberId)
      .neq("review_status", "rejected")
      .maybeSingle();
    if (error) throw error;
    return data ? toApplication(data as Row) : null;
  },

  async create(memberId) {
    const { data, error } = await client()
      .from("applications")
      .insert({ member_id: memberId })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new DuplicateApplicationError();
      }
      throw error;
    }
    return toApplication(data as Row);
  },

  async listAll() {
    const { data, error } = await client()
      .from("applications")
      .select("*, members(wallet_address, display_name)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => {
      const r = row as Row;
      const relatedMember = Array.isArray(r.members) ? r.members[0] : r.members;
      if (!relatedMember || typeof relatedMember !== "object") {
        throw new Error(`member relation missing for application ${String(r.id)}`);
      }
      const member = relatedMember as Row;
      return {
        ...toApplication(r),
        walletAddress: member.wallet_address as Address,
        displayName: (member.display_name as string) ?? null,
      } satisfies ApplicationWithMember;
    });
  },

  async transition({ applicationId, field, toStatus, actorAddress, reason, txId }) {
    const statusColumn = STATUS_COLUMN[field];
    if (!statusColumn) throw new Error(`invalid application field: ${field}`);

    const c = client();
    const { data: current, error: readError } = await c
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();
    if (readError) throw readError;

    const update: Row = {
      [statusColumn]: toStatus,
      updated_at: new Date().toISOString(),
    };
    if (reason !== undefined) update.reason = reason;
    if (field === "distribution" && txId !== undefined) update.distribution_tx_id = txId;

    const { error: updateError } = await c
      .from("applications")
      .update(update)
      .eq("id", applicationId);
    if (updateError) throw updateError;

    const { error: eventError } = await c.from("application_events").insert({
      application_id: applicationId,
      field,
      from_status: (current as Row)[statusColumn],
      to_status: toStatus,
      actor_address: normalizeAddress(actorAddress),
      reason: reason ?? null,
      tx_id: txId ?? null,
    });
    if (eventError) throw eventError;
  },
};

function toCheckin(row: Row): Checkin {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    checkinDate: row.checkin_date as string,
    createdAt: row.created_at as string,
  };
}

const checkins: CheckinRepository = {
  async checkinToday(memberId) {
    const { data, error } = await client()
      .from("checkins")
      .insert({ member_id: memberId })
      .select()
      .single();
    if (error && error.code === "23505") {
      const { data: existing, error: existingError } = await client()
        .from("checkins")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (existingError) throw existingError;
      return { created: false, checkin: toCheckin(existing as Row) };
    }
    if (error) throw error;
    return { created: true, checkin: toCheckin(data as Row) };
  },

  async listByMember(memberId) {
    const { data, error } = await client()
      .from("checkins")
      .select("*")
      .eq("member_id", memberId)
      .order("checkin_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => toCheckin(row as Row));
  },
};

export const supabaseRepositories: Repositories = {
  members,
  progress,
  applications,
  checkins,
};
