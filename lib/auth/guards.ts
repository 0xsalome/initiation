// ABOUTME: Server Action / Route Handler用の認可ガードを提供する。
// ABOUTME: セッションから正規化済みmemberを解決し、管理者allowlistを一元適用する。
import { normalizeAddress } from "@/lib/domain/address";
import type { Address, Member } from "@/lib/domain/types";
import { getRepositories } from "@/lib/repositories";
import { getSession } from "@/lib/session";
import { isAdminAddress } from "./admin";

export class UnauthenticatedError extends Error {
  constructor(message = "authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "admin access required") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireMember(): Promise<Member> {
  const session = await getSession();
  if (!session.address) throw new UnauthenticatedError();

  let address: Address;
  try {
    address = normalizeAddress(session.address);
  } catch {
    throw new UnauthenticatedError();
  }

  const member = await getRepositories().members.findByAddress(address);
  if (!member) throw new UnauthenticatedError();
  return member;
}

export async function requireAdmin(): Promise<{ member: Member; address: Address }> {
  const member = await requireMember();
  if (!isAdminAddress(member.walletAddress)) throw new ForbiddenError();
  return { member, address: member.walletAddress };
}
