// ABOUTME: 現在の認証済みウォレットアドレスを返すセッション確認エンドポイント。
// ABOUTME: 未認証の場合は一貫して 401 を返す。
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.address) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return Response.json({ address: session.address });
}
