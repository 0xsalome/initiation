// ABOUTME: 申請ページ。現在の申請状態を表示し、未申請なら申請フォームを出す。
// ABOUTME: 申請後のAllowlist追加とHENKAKU送付は運営が手作業で行う。
import Link from "next/link";
import { ApplyForm } from "@/components/ApplyForm";
import type { Application } from "@/lib/domain/types";
import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";
import { cardStyles } from "@/lib/ui";

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
        <main className={cardStyles}>
          <p className="leading-7 text-muted">
            先に <Link href="/setup">ウォレットセットアップ</Link> でサインインしてください。
          </p>
        </main>
      );
    }
    throw error;
  }

  return (
    <main className="space-y-8">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">Step 4</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Allowlist と HENKAKU の申請
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Initiation完走後、運営が内容を確認してAllowlist追加とHENKAKU送付を手動で行います。
        </p>
      </header>
      {application ? (
        <section className={cardStyles}>
          <h2 className="text-xl font-bold text-foreground">申請の状態</h2>
          <dl className="mt-5 divide-y divide-border">
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-muted">審査</dt>
              <dd className="font-semibold text-foreground">{REVIEW_LABEL[application.reviewStatus]}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-muted">Allowlist</dt>
              <dd className="font-semibold text-foreground">{application.allowlistStatus === "added" ? "追加済み" : "未実施"}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-muted">HENKAKU 配布</dt>
              <dd className="font-semibold text-foreground">
                {application.distributionStatus === "sent"
                  ? `送付済み (tx: ${application.distributionTxId ?? "記録なし"})`
                  : "未実施"}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <ApplyForm />
      )}
    </main>
  );
}
