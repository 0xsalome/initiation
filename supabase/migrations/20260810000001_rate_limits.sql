-- ABOUTME: 認証後のServer Action向けに、固定ウィンドウのレート制限をDB側で数える。
-- ABOUTME: 数え上げと判定を1文にまとめ、同時呼び出しでも上限を越えないようにする(Issue #37)。

-- 対象は「認証後」の入口のみ。未認証の /api/auth/* をここで数えないのは、
-- 署名検証(CPUで1ms未満)よりDBへの往復のほうが高くつき、外部から無料で
-- DB書き込みを強制できる形になるため。未認証側はホスティング側の層で扱う。
create table rate_limits (
  -- 入口の識別子。lib/domain/rateLimits.ts の定義と対応する。
  bucket text not null,
  -- 数える単位。ウォレットアドレス(正規化済みの小文字)。
  -- IPではなくアドレスにしているのは、同一ネットワークのメンバーが
  -- まとめて詰まるのを避けるため(Issue #37)。
  subject text not null
    check (subject = lower(subject)),
  window_started_at timestamptz not null,
  count integer not null,
  primary key (bucket, subject)
);

-- 固定ウィンドウ。ウィンドウを跨いだ最初の1回でカウンタを巻き戻す。
-- 上限を越えた呼び出しも数える(越えている間はウィンドウが切れるまで通さない)。
--
-- 判定を関数にしているのは、読み取り→加算→書き込みを別々のSQLで行うと、
-- 同時に呼ばれたときに上限を越えて通ってしまうため。insert ... on conflict
-- do update は対象行のロックを取るので、この1文の中で直列化される。
create function public.consume_rate_limit(
  p_bucket text,
  p_subject text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit: limit=% window=%', p_limit, p_window_seconds;
  end if;

  insert into public.rate_limits as existing (bucket, subject, window_started_at, count)
  values (p_bucket, p_subject, now(), 1)
  on conflict (bucket, subject) do update
  set
    window_started_at = case
      when existing.window_started_at
             < now() - make_interval(secs => p_window_seconds)
        then now()
      else existing.window_started_at
    end,
    count = case
      when existing.window_started_at
             < now() - make_interval(secs => p_window_seconds)
        then 1
      else existing.count + 1
    end
  returning existing.count into v_count;

  return v_count <= p_limit;
end;
$$;

alter table rate_limits enable row level security;

grant all on table rate_limits to service_role;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
