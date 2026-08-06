// ABOUTME: 申請ページ。現在の申請状態を表示し、未申請なら申請フォームを出す。
// ABOUTME: 申請後のAllowlist追加とHENKAKU送付は運営が手作業で行う。
import Link from "next/link";
import { ApplyForm } from "@/components/ApplyForm";
import type { Application } from "@/lib/domain/types";
import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";

const REVIEW_LABEL: Record<Application["reviewStatus"], string> = {
  pending: "審査待ち",
  needs_info: "追加情報が必要です（運営から連絡します）",
  approved: "承認済み",
  rejected: "見送りになりました",
};

export default async function ApplyPage() {
  let application: Application | null;
  try {
    const member = await requireMember();
    application = await getRepositories().applications.findActiveByMember(member.id);
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return (
        <main>
          <p>
            先に <Link href="/setup">ウォレットセットアップ</Link> でサインインしてください。
          </p>
        </main>
      );
    }
    throw error;
  }

  return (
    <main>
      <h1>Allowlist と HENKAKU の申請</h1>
      {application ? (
        <dl>
          <dt>審査</dt>
          <dd>{REVIEW_LABEL[application.reviewStatus]}</dd>
          <dt>Allowlist</dt>
          <dd>{application.allowlistStatus === "added" ? "追加済み" : "未実施"}</dd>
          <dt>HENKAKU 配布</dt>
          <dd>
            {application.distributionStatus === "sent"
              ? `送付済み (tx: ${application.distributionTxId ?? "記録なし"})`
              : "未実施"}
          </dd>
        </dl>
      ) : (
        <ApplyForm />
      )}
    </main>
  );
}
