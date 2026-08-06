// ABOUTME: チェックインのServer Actionを提供する。
// ABOUTME: 1日1回(JST)の制約はRepositoryとDBの一意制約に委譲する。
"use server";

import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";

export async function checkin(): Promise<{ ok: boolean; alreadyCheckedIn?: boolean; error?: string }> {
  try {
    const member = await requireMember();
    const result = await getRepositories().checkins.checkinToday(member.id);
    return { ok: true, alreadyCheckedIn: !result.created };
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return { ok: false, error: "サインインしてください" };
    }
    throw error;
  }
}
