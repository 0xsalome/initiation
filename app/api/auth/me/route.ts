// ABOUTME: 現在の認証済みウォレットアドレスと管理者かどうかを返すセッション確認エンドポイント。
// ABOUTME: 未認証の場合は一貫して 401 を返す。
import { normalizeAddress } from "@/lib/domain/address";
import { isAdminAddress } from "@/lib/auth/admin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.address) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  // 返すのは要求者自身の権限のみ。管理者の一覧や他人の状態は返さない。
  const address = normalizeAddress(session.address);
  return Response.json({ address, isAdmin: isAdminAddress(address) });
}
