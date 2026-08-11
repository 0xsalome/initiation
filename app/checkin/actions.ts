// ABOUTME: チェックインのServer Actionを提供する。
// ABOUTME: 1日1回(JST)の制約はRepositoryとDBの一意制約に委譲する。
"use server";

import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { consumeRateLimit, RateLimitedError } from "@/lib/auth/rateLimit";
import { rateLimitMessage, rateLimitRules } from "@/lib/domain/rateLimits";
import { getRepositories } from "@/lib/repositories";

export async function checkin(): Promise<{ ok: boolean; alreadyCheckedIn?: boolean; error?: string }> {
  try {
    const member = await requireMember();
    // 1日1回はDBの一意制約が担保しているが、2回目以降の呼び出し自体は
    // 無制限に通っていた。ここで数えるのはその繰り返しのほう。
    await consumeRateLimit(rateLimitRules.checkin, member.walletAddress);

    const result = await getRepositories().checkins.checkinToday(member.id);
    return { ok: true, alreadyCheckedIn: !result.created };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { ok: false, error: rateLimitMessage(error.rule) };
    }
    if (error instanceof UnauthenticatedError) {
      return { ok: false, error: "サインインしてください" };
    }
    throw error;
  }
}
