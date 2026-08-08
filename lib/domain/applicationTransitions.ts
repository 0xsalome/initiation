// ABOUTME: 申請ステータスの遷移ルールを定義する。
// ABOUTME: 管理アクションは永続化前にこの純粋関数を通して状態を検証する。
import type { Application, StatusField } from "./types";

const REVIEW_TRANSITIONS: Record<string, string[]> = {
  pending: ["needs_info", "approved", "rejected"],
  needs_info: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

const EXECUTION_TRANSITIONS: Record<string, Record<string, string[]>> = {
  allowlist: {
    pending: ["added", "failed"],
    failed: ["added"],
    added: [],
  },
  distribution: {
    pending: ["sent", "failed"],
    failed: ["sent"],
    sent: [],
  },
};

export function currentStatus(app: Application, field: StatusField): string {
  if (field === "review") return app.reviewStatus;
  if (field === "allowlist") return app.allowlistStatus;
  return app.distributionStatus;
}

export function validateTransition(
  app: Application,
  field: StatusField,
  toStatus: string,
): { ok: true } | { ok: false; reason: string } {
  if (field === "review") {
    const allowed = REVIEW_TRANSITIONS[app.reviewStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      return { ok: false, reason: `review: ${app.reviewStatus} -> ${toStatus} は許可されていません` };
    }
    return { ok: true };
  }

  if (app.reviewStatus !== "approved") {
    return { ok: false, reason: "承認前に実行状態は変更できません" };
  }

  const transitions = EXECUTION_TRANSITIONS[field];
  if (!transitions) {
    return { ok: false, reason: `不明な状態フィールドです: ${field}` };
  }

  const current = currentStatus(app, field);
  const allowed = transitions[current] ?? [];
  if (!allowed.includes(toStatus)) {
    return { ok: false, reason: `${field}: ${current} -> ${toStatus} は許可されていません` };
  }
  return { ok: true };
}
