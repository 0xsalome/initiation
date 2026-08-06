// ABOUTME: Repository統合テスト用のローカルSupabase接続とテーブル初期化。
// ABOUTME: 各テストを独立させるため、外部キーの子テーブルから削除する。
import { createClient } from "@supabase/supabase-js";

export function testClient() {
  const url = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY を設定してください(supabase status で取得)");
  return createClient(url, key);
}

export async function truncateAll() {
  const client = testClient();
  for (const table of ["application_events", "applications", "initiation_progress", "checkins", "members"]) {
    const { error } = await client.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  }
}
