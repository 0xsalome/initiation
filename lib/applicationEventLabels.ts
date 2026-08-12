// ABOUTME: 運営向けに遷移履歴を表示するためのラベルを定義する。
// ABOUTME: 申請者向けの lib/applicationLabels.ts とは読み手が違うため分けている。
import type { StatusField } from "@/lib/domain/types";

const FIELD_LABELS: Record<StatusField, string> = {
  review: "審査",
  allowlist: "Allowlist",
  distribution: "配布",
};

export function fieldLabel(field: StatusField): string {
  return FIELD_LABELS[field];
}
