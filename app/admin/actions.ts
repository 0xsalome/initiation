// ABOUTME: 管理者用の申請状態遷移Server Actionを提供する。
// ABOUTME: requireAdminと遷移ルールを必ず通し、Repositoryへ実行者と理由を渡す。
"use server";

import { currentStatus, validateTransition } from "@/lib/domain/applicationTransitions";
import { rateLimitMessage, rateLimitRules } from "@/lib/domain/rateLimits";
import type { StatusField } from "@/lib/domain/types";
import {
  ForbiddenError,
  requireAdmin,
  UnauthenticatedError,
} from "@/lib/auth/guards";
import { consumeRateLimit, RateLimitedError } from "@/lib/auth/rateLimit";
import { ConcurrentTransitionError, getRepositories } from "@/lib/repositories";

export async function transitionApplication(params: {
  applicationId: string;
  field: StatusField;
  toStatus: string;
  reason?: string;
  txId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { address } = await requireAdmin();
    // 一覧の取得より前に数える。遷移ルールに弾かれる呼び出しも
    // 全申請の取得を伴うため、そこへ届く前に止める。
    await consumeRateLimit(rateLimitRules.applicationTransition, address);

    const repositories = getRepositories();
    const applications = await repositories.applications.listAll();
    const application = applications.find((item) => item.id === params.applicationId);
    if (!application) {
      return { ok: false, error: "申請が見つかりません" };
    }

    const validation = validateTransition(application, params.field, params.toStatus);
    if (!validation.ok) {
      return { ok: false, error: validation.reason };
    }

    // 完了として記録する操作は、対応するオンチェーン取引の確認記録を必ず残す。
    // Allowlist追加もコントラクト操作なのでtx hashが出る(Runbook「3. Allowlistへ追加する」)。
    // 配布と扱いを揃え、運用ログ側へ書き写す必要をなくす(Issue #33)。
    const txId = params.txId?.trim();
    if (!txId) {
      if (params.field === "distribution" && params.toStatus === "sent") {
        return { ok: false, error: "トランザクションIDを入力してください" };
      }
      if (params.field === "allowlist" && params.toStatus === "added") {
        return { ok: false, error: "Allowlist追加のトランザクションIDを入力してください" };
      }
    }

    // 失敗の記録は再試行の判断材料になるため、Runbookどおり理由を必須にする。
    const reason = params.reason?.trim() || undefined;
    if (params.toStatus === "failed" && !reason) {
      return { ok: false, error: "失敗理由を入力してください" };
    }

    // 却下・要追加情報は申請者へ伝える内容そのものなので理由を必須にする。
    // 承認は理由がなくても後から状態で追えるため必須にしない(Issue #19)。
    if (params.field === "review" && !reason) {
      if (params.toStatus === "rejected") {
        return { ok: false, error: "却下理由を入力してください" };
      }
      if (params.toStatus === "needs_info") {
        return { ok: false, error: "必要な追加情報を入力してください" };
      }
    }

    await repositories.applications.transition({
      applicationId: params.applicationId,
      field: params.field,
      toStatus: params.toStatus,
      expectedStatus: currentStatus(application, params.field),
      actorAddress: address,
      reason,
      txId,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      return { ok: false, error: "権限がありません" };
    }
    if (error instanceof RateLimitedError) {
      return { ok: false, error: rateLimitMessage(error.rule) };
    }
    if (error instanceof ConcurrentTransitionError) {
      return {
        ok: false,
        error: "他の管理者が先に状態を更新したため、操作を適用しませんでした。画面を再読み込みして最新の状態を確認してください",
      };
    }
    throw error;
  }
}
