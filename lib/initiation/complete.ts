// ABOUTME: Initiationの全ステップ完走判定を提供する。
// ABOUTME: Server Actionに依存しない純粋関数として画面と申請条件から共有する。
import { initiationSteps } from "./content";
import type { ProgressEntry } from "@/lib/domain/types";

export function isInitiationComplete(entries: ProgressEntry[]): boolean {
  const done = new Set(entries.map((entry) => entry.stepId));
  return initiationSteps.every((step) => done.has(step.id));
}
