-- ABOUTME: MVP-1のコアテーブルをSupabase PostgreSQLに定義する。
-- ABOUTME: RLSとservice_role権限を明示し、アプリのRepository経由のアクセスを支える。
-- MVP-1 コアテーブル。questions/answers(質問箱)はフェーズ2で追加する。

create table members (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique
    check (wallet_address = lower(wallet_address)),
  display_name text,
  first_authenticated_at timestamptz not null default now()
);

create table initiation_progress (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  step_id text not null,
  answer text,
  completed_at timestamptz not null default now(),
  unique (member_id, step_id)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'needs_info', 'approved', 'rejected')),
  allowlist_status text not null default 'pending'
    check (allowlist_status in ('pending', 'added', 'failed')),
  distribution_status text not null default 'pending'
    check (distribution_status in ('pending', 'sent', 'failed')),
  distribution_tx_id text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 重複申請防止: rejected 以外の申請は member あたり 1 件
create unique index applications_active_per_member
  on applications (member_id)
  where review_status <> 'rejected';

create table application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id),
  field text not null check (field in ('review', 'allowlist', 'distribution')),
  from_status text,
  to_status text not null,
  actor_address text not null,
  reason text,
  tx_id text,
  created_at timestamptz not null default now()
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id),
  checkin_date date not null default ((now() at time zone 'Asia/Tokyo')::date),
  created_at timestamptz not null default now(),
  unique (member_id, checkin_date)
);

-- アプリはサーバー側のservice_role経由でのみDBへアクセスする。
alter table members enable row level security;
alter table initiation_progress enable row level security;
alter table applications enable row level security;
alter table application_events enable row level security;
alter table checkins enable row level security;

grant usage on schema public to service_role;
grant all on table
  members,
  initiation_progress,
  applications,
  application_events,
  checkins
to service_role;
