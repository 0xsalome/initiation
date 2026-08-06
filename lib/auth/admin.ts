// ABOUTME: 管理者判定。ADMIN_ADDRESSES(カンマ区切り)との正規化済み比較のみ。
// ABOUTME: 秘密鍵やSafeの配布権限には触れず、管理画面のアクセスだけを制御する。
import type { Address } from "@/lib/domain/types";

export function isAdminAddress(address: Address): boolean {
  const raw = process.env.ADMIN_ADDRESSES ?? "";
  const admins = raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return admins.includes(address);
}
