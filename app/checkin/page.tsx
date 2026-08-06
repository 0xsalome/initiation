// ABOUTME: チェックインページ。今日のチェックインと履歴を表示する。
// ABOUTME: 履歴取得はServer Componentで行い、実行操作だけClient Componentに委譲する。
import Link from "next/link";
import { CheckinButton } from "@/components/CheckinButton";
import type { Checkin } from "@/lib/domain/types";
import { requireMember, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";

export default async function CheckinPage() {
  let history: Checkin[];
  try {
    const member = await requireMember();
    history = await getRepositories().checkins.listByMember(member.id);
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
      <h1>チェックイン</h1>
      <p>今日の活動を記録しましょう。</p>
      <CheckinButton />
      <h2>これまでのチェックイン</h2>
      {history.length > 0 ? (
        <ul>
          {history.map((checkin) => (
            <li key={checkin.id}>{checkin.checkinDate}</li>
          ))}
        </ul>
      ) : (
        <p>まだ履歴はありません。</p>
      )}
    </main>
  );
}
