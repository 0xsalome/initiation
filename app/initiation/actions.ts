// ABOUTME: Initiation進捗のServer Actionsを提供する。
// ABOUTME: ステップ入力を検証して、認証済みmemberのRepositoryへ保存する。
"use server";

import { findStep } from "@/lib/initiation/content";
import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";

export async function saveStep(
  stepId: string,
  answer: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const step = findStep(stepId);
  if (!step) return { ok: false, error: "不明なステップです" };
  if (step.kind === "question" && (!answer || answer.trim() === "")) {
    return { ok: false, error: "回答を入力してください" };
  }

  try {
    const member = await requireMember();
    await getRepositories().progress.save(member.id, stepId, answer);
    return { ok: true };
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return { ok: false, error: "サインインしてください" };
    }
    throw error;
  }
}
