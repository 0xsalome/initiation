// ABOUTME: DB非依存のRepository契約と実装選択の入口を定義する。
// ABOUTME: 各機能はこの契約だけを使い、Supabase依存を一箇所に隔離する。
import { supabaseRepositories } from "./supabase";
import type {
  Address,
  Application,
  ApplicationWithMember,
  Checkin,
  Member,
  ProgressEntry,
  StatusField,
} from "@/lib/domain/types";

export interface MemberRepository {
  findByAddress(address: Address): Promise<Member | null>;
  upsertByAddress(address: Address): Promise<Member>;
  updateDisplayName(memberId: string, displayName: string): Promise<void>;
}

export interface ProgressRepository {
  listByMember(memberId: string): Promise<ProgressEntry[]>;
  save(memberId: string, stepId: string, answer: string | null): Promise<void>;
}

export interface ApplicationRepository {
  findActiveByMember(memberId: string): Promise<Application | null>;
  create(memberId: string): Promise<Application>;
  listAll(): Promise<ApplicationWithMember[]>;
  transition(params: {
    applicationId: string;
    field: StatusField;
    toStatus: string;
    actorAddress: Address;
    reason?: string;
    txId?: string;
  }): Promise<void>;
}

export interface CheckinRepository {
  checkinToday(memberId: string): Promise<{ created: boolean; checkin: Checkin }>;
  listByMember(memberId: string): Promise<Checkin[]>;
}

export class DuplicateApplicationError extends Error {
  constructor(message = "active application already exists") {
    super(message);
    this.name = "DuplicateApplicationError";
  }
}

export type Repositories = {
  members: MemberRepository;
  progress: ProgressRepository;
  applications: ApplicationRepository;
  checkins: CheckinRepository;
};

export function getRepositories(): Repositories {
  return supabaseRepositories;
}
