// ABOUTME: サーバーのセッションを画面から参照するためのクライアント側フック。
// ABOUTME: 画面の表示を React の状態ではなくサーバーの認識に合わせる(Issue #40)。
"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Address } from "@/lib/domain/types";

export type SessionStatus = { address: Address; isAdmin: boolean } | null;

/** 同じキーを共有することで、ヘッダーと /setup が同じ結果を1回の取得で使う。 */
export const sessionQueryKey = ["session"] as const;

async function fetchSession(): Promise<SessionStatus> {
  const response = await fetch("/api/auth/me");
  // 未サインインは異常ではないので、エラーではなく null として扱う。
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("セッションの取得に失敗しました");
  return (await response.json()) as SessionStatus;
}

export function useSession() {
  return useQuery({ queryKey: sessionQueryKey, queryFn: fetchSession });
}

/**
 * サインイン・サインアウトの直後に、画面の表示をサーバーへ合わせ直す。
 * useEffect の依存に入れられるよう、関数の同一性を保つ。
 */
export function useRefreshSession(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
  }, [queryClient]);
}
