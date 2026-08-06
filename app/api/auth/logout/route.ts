// ABOUTME: 認証 Cookie を破棄してサーバーセッションを無効化する。
// ABOUTME: アカウント変更・チェーン変更時と明示的なログアウトから利用する。
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return Response.json({ ok: true });
}
