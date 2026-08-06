// ABOUTME: SIWE 署名に使う一回限りの nonce を Cookie セッションへ発行する。
// ABOUTME: nonce 自体は秘密ではないが、サーバー側のセッション状態と組み合わせて再利用を防ぐ。
import { generateNonce } from "siwe";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  session.nonce = generateNonce();
  await session.save();
  return Response.json({ nonce: session.nonce });
}
