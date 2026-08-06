create table spike_members (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  created_at timestamptz not null default now()
);

-- 現行 Supabase CLI は新規テーブルを API に自動公開しないため、スパイク用 service_role に明示的に権限を付与する。
grant all on table public.spike_members to service_role;
