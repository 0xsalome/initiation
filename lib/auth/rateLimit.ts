// ABOUTME: 認証後のServer Actionで、実行者のアドレス単位に上限を消費する。
// ABOUTME: 認可ガードの直後・実際の処理の前に置き、失敗する呼び出しも数える(Issue #37)。
import type { Address } from "@/lib/domain/types";
import type { RateLimitRule } from "@/lib/domain/rateLimits";
import { getRepositories } from "@/lib/repositories";

export class RateLimitedError extends Error {
  constructor(readonly rule: RateLimitRule) {
    super(`rate limited: ${rule.bucket}`);
    this.name = "RateLimitedError";
  }
}

/**
 * 1回分を消費する。上限を越えていれば RateLimitedError を投げる。
 *
 * 呼ぶ場所は「認可を解決した直後、処理を始める前」。今止めたいのは
 * 成功する操作ではなく、DBの制約に弾かれ続ける呼び出しのほうなので、
 * 処理の後ろに置くと数え漏らす。
 *
 * DBへ到達できないときは例外がそのまま伝わる(通してしまわない)。
 * これらのServer Actionはいずれにせよ同じDBを必要とするので、
 * ここだけ通しても処理は先に進めない。
 */
export async function consumeRateLimit(rule: RateLimitRule, subject: Address): Promise<void> {
  const allowed = await getRepositories().rateLimits.consume({
    bucket: rule.bucket,
    subject,
    limit: rule.limit,
    windowSeconds: rule.windowSeconds,
  });
  if (!allowed) throw new RateLimitedError(rule);
}
