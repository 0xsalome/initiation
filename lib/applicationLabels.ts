// ABOUTME: 申請者向けに申請状態を表示するラベルを定義する。
// ABOUTME: failedは運営が対応中であることを伝え、未実施(pending)と区別する。
import type { Application } from "@/lib/domain/types";

export const reviewLabel: Record<Application["reviewStatus"], string> = {
  pending: "審査待ち",
  needs_info: "追加情報が必要です（運営から連絡します）",
  approved: "承認済み",
  rejected: "見送りになりました",
};

// 失敗の詳細は申請者側で対処できないため、運営が対応中であることだけを伝える。
const IN_PROGRESS = "運営が対応中です";

export function allowlistLabel(status: Application["allowlistStatus"]): string {
  if (status === "added") return "追加済み";
  if (status === "failed") return IN_PROGRESS;
  return "未実施";
}

export function distributionLabel(
  status: Application["distributionStatus"],
  txId: string | null,
): string {
  if (status === "sent") return `送付済み (tx: ${txId ?? "記録なし"})`;
  if (status === "failed") return IN_PROGRESS;
  return "未実施";
}
