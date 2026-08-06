// ABOUTME: Allowlist追加とHENKAKU配布申請のServer Actionを提供する。
// ABOUTME: Initiation完走を確認し、重複申請は利用者向けの結果へ変換する。
"use server";

import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { isInitiationComplete } from "@/lib/initiation/complete";
import { DuplicateApplicationError, getRepositories } from "@/lib/repositories";

export async function submitApplication(): Promise<{ ok: boolean; error?: string }> {
  try {
    const member = await requireMember();
    const repositories = getRepositories();
    const entries = await repositories.progress.listByMember(member.id);
    if (!isInitiationComplete(entries)) {
      return { ok: false, error: "先に Initiation を完走してください" };
    }

    await repositories.applications.create(member.id);
    return { ok: true };
  } catch (error) {
    if (error instanceof DuplicateApplicationError) {
      return { ok: false, error: "すでに申請済みです。審査をお待ちください" };
    }
    if (error instanceof UnauthenticatedError) {
      return { ok: false, error: "サインインしてください" };
    }
    throw error;
  }
}
