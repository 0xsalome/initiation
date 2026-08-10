// ABOUTME: iron-session による Cookie セッション。nonce と認証済みアドレスを保持する。
// ABOUTME: セッションパスワード・有効期限・Cookie 属性をサーバー側で一元管理する。
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

/**
 * セッションの有効期限。iron-session の既定値と同じ14日だが、依存の更新で
 * 既定値が変わっても挙動が動かないよう明示する(Issue #41)。
 * サインイン時点からの絶対期限で、閲覧では延長されない。
 */
const SESSION_TTL_SECONDS = 14 * 24 * 60 * 60;

export type SessionData = {
  address?: `0x${string}`;
  chainId?: number;
  nonce?: string;
};

function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_PASSWORD;
  if (!password || password.length < 32) {
    throw new Error("SESSION_PASSWORD must be at least 32 characters");
  }

  return {
    password,
    ttl: SESSION_TTL_SECONDS,
    cookieName: "initiation_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}
