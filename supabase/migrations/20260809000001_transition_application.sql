-- ABOUTME: 申請の条件付き状態更新と監査イベント記録を1トランザクションにまとめる関数。
-- ABOUTME: 状態だけが変わって application_events に記録が残らない不整合を防ぐ(Issue #21)。

-- 遷移ルールの検証はアプリ側(lib/domain/applicationTransitions.ts)に残す。
-- この関数が担うのは「条件付きUPDATE + イベントINSERT」を不可分にすることだけで、
-- どの遷移を許すかという知識はSQLへ持ち込まない。
create function public.transition_application(
  p_application_id uuid,
  p_field text,
  p_to_status text,
  p_expected_status text,
  p_actor_address text,
  p_reason text default null,
  p_tx_id text default null
) returns uuid
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if p_field not in ('review', 'allowlist', 'distribution') then
    raise exception 'invalid application field: %', p_field;
  end if;

  -- 呼び出し側が検証した時点の値を条件に含めることで、読み取りから更新までの間に
  -- 別の管理者が遷移させていた場合は0行となり、上書きを防ぐ(Issue #5)。
  update public.applications
  set
    review_status =
      case when p_field = 'review' then p_to_status else review_status end,
    allowlist_status =
      case when p_field = 'allowlist' then p_to_status else allowlist_status end,
    distribution_status =
      case when p_field = 'distribution' then p_to_status else distribution_status end,
    -- 理由と配布tx hashは指定されたときだけ上書きする(未指定は現状維持)。
    reason = coalesce(p_reason, reason),
    distribution_tx_id =
      case
        when p_field = 'distribution' and p_tx_id is not null then p_tx_id
        else distribution_tx_id
      end,
    updated_at = now()
  where id = p_application_id
    and case p_field
      when 'review' then review_status
      when 'allowlist' then allowlist_status
      when 'distribution' then distribution_status
    end = p_expected_status
  returning id into v_id;

  -- 0行のときはNULLを返し、競合として扱うかどうかの判断は呼び出し側に任せる。
  if v_id is null then
    return null;
  end if;

  -- UPDATEが成功した時点で遷移前の値は p_expected_status だったことが保証される。
  -- ここで例外が起きた場合、関数全体が1トランザクションなのでUPDATEも巻き戻る。
  insert into public.application_events (
    application_id, field, from_status, to_status, actor_address, reason, tx_id
  ) values (
    p_application_id, p_field, p_expected_status, p_to_status,
    p_actor_address, p_reason, p_tx_id
  );

  return v_id;
end;
$$;

-- アプリはサーバー側のservice_role経由でのみDBへアクセスする。
revoke execute on function public.transition_application(
  uuid, text, text, text, text, text, text
) from public, anon, authenticated;

grant execute on function public.transition_application(
  uuid, text, text, text, text, text, text
) to service_role;
