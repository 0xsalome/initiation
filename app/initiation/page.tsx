// ABOUTME: Initiation画面。ステップ一覧・進捗・回答フォームを表示する。
// ABOUTME: 未認証者にはウォレットセットアップへの導線を出し、完走者には申請へ案内する。
import Link from "next/link";
import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";
import { initiationSteps } from "@/lib/initiation/content";
import { isInitiationComplete } from "@/lib/initiation/complete";
import type { ProgressEntry } from "@/lib/domain/types";
import { InitiationSteps } from "@/components/InitiationSteps";

export default async function InitiationPage() {
  let entries: ProgressEntry[];
  try {
    const member = await requireMember();
    entries = await getRepositories().progress.listByMember(member.id);
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

  const complete = isInitiationComplete(entries);
  return (
    <main>
      <h1>Initiation</h1>
      <p>一つずつ進めて、HENKAKUへの参加準備を整えましょう。</p>
      <InitiationSteps steps={initiationSteps} entries={entries} />
      {complete && (
        <p>
          完走おめでとうございます！
          <Link className="primaryLink" href="/apply">
            AllowlistとHENKAKUの申請へ →
          </Link>
        </p>
      )}
    </main>
  );
}
