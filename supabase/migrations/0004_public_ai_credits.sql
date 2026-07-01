-- =============================================================
-- Public AI credits：公网真实调用的匿名用户每日额度
--
-- 机制：
--   * 服务端用匿名 JWT sub / IP fallback 作为 identity_key。
--   * 每个 identity_key 每个 UTC 日期固定额度，由 RPC 原子扣减。
--   * 表不对 anon 开放；仅服务端 service_role 调用 RPC。
-- =============================================================

create table if not exists public_ai_usage (
  id              uuid primary key default gen_random_uuid(),
  usage_date      date not null default (timezone('utc', now())::date),
  identity_key    text not null,
  used_credits    int not null default 0 check (used_credits >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (usage_date, identity_key)
);

create index if not exists public_ai_usage_date_idx
  on public_ai_usage (usage_date desc);

alter table public_ai_usage enable row level security;

create or replace function consume_public_ai_credits(
  p_identity_key text,
  p_credits int,
  p_daily_limit int
)
returns table (
  ok boolean,
  used_credits int,
  remaining_credits int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('utc', now())::date;
  v_used int := 0;
begin
  if p_identity_key is null
     or length(trim(p_identity_key)) = 0
     or p_credits <= 0
     or p_daily_limit <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public_ai_usage (usage_date, identity_key, used_credits)
  values (v_today, p_identity_key, 0)
  on conflict (usage_date, identity_key) do nothing;

  update public_ai_usage
     set used_credits = public_ai_usage.used_credits + p_credits,
         updated_at = now()
   where usage_date = v_today
     and identity_key = p_identity_key
     and public_ai_usage.used_credits + p_credits <= p_daily_limit
   returning public_ai_usage.used_credits into v_used;

  if v_used is null then
    select public_ai_usage.used_credits
      into v_used
      from public_ai_usage
     where usage_date = v_today
       and identity_key = p_identity_key;

    return query select false, coalesce(v_used, 0), greatest(p_daily_limit - coalesce(v_used, 0), 0);
    return;
  end if;

  return query select true, v_used, greatest(p_daily_limit - v_used, 0);
end;
$$;

