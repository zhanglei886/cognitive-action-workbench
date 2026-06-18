-- ============================================================
-- AI 配额追踪 + CDK 兑换系统
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- AI 使用记录表
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('summary', 'report')),
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;
create policy "ai_usage_policy" on public.ai_usage for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_ai_usage_user_month on public.ai_usage(user_id, type, created_at);


-- CDK 兑换码表
create table if not exists public.cdk_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  tier text not null check (tier in ('pro_monthly', 'pro_annual', 'lifetime')),
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.cdk_codes enable row level security;
create policy "cdk_read_policy" on public.cdk_codes for select using (true);
-- 只有服务器端可以修改 CDK（通过 Edge Function）


-- 预置 CDK
insert into public.cdk_codes (code, tier)
values ('zhangleihaoshuai', 'lifetime')
on conflict (code) do nothing;


-- RPC：兑换 CDK
create or replace function redeem_cdk(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_cdk public.cdk_codes;
begin
  -- 特殊 CDK：无限次使用
  if p_code = 'zhangleihaoshuai' then
    update public.profiles
    set subscription_tier = 'lifetime', updated_at = now()
    where id = p_user_id;
    return jsonb_build_object('success', true, 'tier', 'lifetime');
  end if;

  -- 普通 CDK：一次性使用
  select * into v_cdk from public.cdk_codes
  where code = p_code and used_by is null;

  if not found then
    return jsonb_build_object('success', false, 'message', '无效的兑换码或已被使用');
  end if;

  update public.cdk_codes
  set used_by = p_user_id, used_at = now()
  where id = v_cdk.id;

  update public.profiles
  set subscription_tier = v_cdk.tier, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('success', true, 'tier', v_cdk.tier);
end;
$$;
