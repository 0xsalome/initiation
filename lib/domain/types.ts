// ABOUTME: Initiation MVP-1の永続化モデルと状態値を定義する。
// ABOUTME: Repositoryと画面の間で使うDB非依存のドメイン型を提供する。
export type Address = `0x${string}`;
export type ReviewStatus = "pending" | "needs_info" | "approved" | "rejected";
export type AllowlistStatus = "pending" | "added" | "failed";
export type DistributionStatus = "pending" | "sent" | "failed";
export type StatusField = "review" | "allowlist" | "distribution";

export type Member = {
  id: string;
  walletAddress: Address;
  displayName: string | null;
  firstAuthenticatedAt: string;
};

export type ProgressEntry = {
  stepId: string;
  answer: string | null;
  completedAt: string;
};

export type Application = {
  id: string;
  memberId: string;
  reviewStatus: ReviewStatus;
  allowlistStatus: AllowlistStatus;
  distributionStatus: DistributionStatus;
  distributionTxId: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationWithMember = Application & {
  walletAddress: Address;
  displayName: string | null;
};

export type Checkin = {
  id: string;
  memberId: string;
  checkinDate: string;
  createdAt: string;
};
