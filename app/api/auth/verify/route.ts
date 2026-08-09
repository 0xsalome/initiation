// ABOUTME: クライアントから受け取った SIWE 署名を検証し、認証済みセッションを発行する。
// ABOUTME: nonce は成功・失敗を問わず検証試行後に破棄して一回限りにする。
import { polygon } from "wagmi/chains";
import { normalizeAddress } from "@/lib/domain/address";
import { getRepositories } from "@/lib/repositories";
import { getSession } from "@/lib/session";
import { parseAllowedDomains, verifySiweMessage } from "@/lib/siwe";

type VerifyBody = {
  message?: unknown;
  signature?: unknown;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.nonce) {
    return Response.json({ error: "nonce not issued" }, { status: 401 });
  }

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    session.nonce = undefined;
    await session.save();
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const nonce = session.nonce;
  session.nonce = undefined;
  if (
    typeof body.message !== "string" ||
    typeof body.signature !== "string" ||
    !/^0x[0-9a-fA-F]+$/.test(body.signature)
  ) {
    await session.save();
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const result = await verifySiweMessage({
    message: body.message,
    signature: body.signature as `0x${string}`,
    expectedNonce: nonce,
    allowedDomains: parseAllowedDomains(process.env.SIWE_ALLOWED_DOMAINS),
    expectedChainId: polygon.id,
  });

  if (!result.ok) {
    await session.save();
    return Response.json({ error: result.reason }, { status: 401 });
  }

  const address = normalizeAddress(result.address);
  await getRepositories().members.upsertByAddress(address);
  session.address = address;
  session.chainId = polygon.id;
  await session.save();
  return Response.json({ address });
}
