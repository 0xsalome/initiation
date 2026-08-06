// ABOUTME: Supabase 接続と unique 制約の同時 insert 挙動を確認するスパイク。
// ABOUTME: ローカル検証用で、サービスロールキーや接続情報をログに出さない。
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const address = "0x" + "11".repeat(20);

async function main() {
  const cleanup = await supabase.from("spike_members").delete().eq("wallet_address", address);
  if (cleanup.error) throw new Error(`cleanup failed: ${cleanup.error.message}`);

  const results = await Promise.allSettled([
    supabase.from("spike_members").insert({ wallet_address: address }),
    supabase.from("spike_members").insert({ wallet_address: address }),
  ]);

  let uniqueViolation = false;
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.log(`insert ${index + 1}: rejected`);
      return;
    }
    const error = result.value.error;
    if (error?.code === "23505") uniqueViolation = true;
    console.log(`insert ${index + 1}:`, error ? `error ${error.code ?? "unknown"}` : "ok");
  });

  const { count, error } = await supabase
    .from("spike_members")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count failed: ${error.message}`);
  console.log("rows:", count);

  if (count !== 1 || !uniqueViolation) {
    throw new Error("expected one row and one unique violation");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
