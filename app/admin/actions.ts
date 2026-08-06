// ABOUTME: 管理者用の申請状態遷移Server Actionを提供する。
// ABOUTME: requireAdminと遷移ルールを必ず通し、Repositoryへ実行者と理由を渡す。
"use server";

import { validateTransition } from "@/lib/domain/applicationTransitions";
import type { StatusField } from "@/lib/domain/types";
import {
  ForbiddenError,
  requireAdmin,
  UnauthenticatedError,
} from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";

export async function transitionApplication(params: {
  applicationId: string;
  field: StatusField;
  toStatus: string;
  reason?: string;
  txId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { address } = await requireAdmin();
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

    const txId = params.txId?.trim();
    if (params.field === "distribution" && params.toStatus === "sent" && !txId) {
      return { ok: false, error: "トランザクションIDを入力してください" };
    }

    await repositories.applications.transition({
      applicationId: params.applicationId,
      field: params.field,
      toStatus: params.toStatus,
      actorAddress: address,
      reason: params.reason,
      txId,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      return { ok: false, error: "権限がありません" };
    }
    throw error;
  }
}
