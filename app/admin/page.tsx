// ABOUTME: 管理者用の申請一覧を表示する。
// ABOUTME: requireAdminで保護し、一般メンバーや未認証者には404相当を返す。
import { AdminApplicationRow } from "@/components/AdminApplicationRow";
import { ForbiddenError, requireAdmin, UnauthenticatedError } from "@/lib/auth/guards";
import { getRepositories } from "@/lib/repositories";
import { notFound } from "next/navigation";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      notFound();
    }
    throw error;
  }

  const applications = await getRepositories().applications.listAll();

  return (
    <main>
      <h1>申請一覧</h1>
      {applications.length === 0 ? (
        <p>申請はまだありません。</p>
      ) : (
        <table>
          <caption>AllowlistとHENKAKU配布の申請</caption>
          <thead>
            <tr>
              <th scope="col">アドレス</th>
              <th scope="col">審査</th>
              <th scope="col">Allowlist</th>
              <th scope="col">配布</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <AdminApplicationRow key={application.id} application={application} />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
