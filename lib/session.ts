// ABOUTME: iron-session による Cookie セッション。nonce と認証済みアドレスを保持する。
// ABOUTME: セッションパスワードと Cookie 属性をサーバー側で一元管理する。
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

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
