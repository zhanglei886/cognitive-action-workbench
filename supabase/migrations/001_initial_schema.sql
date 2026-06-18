-- ============================================================
-- 认知工作台 Supabase 初始化 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 0. 用户 Profile 表（关联 Supabase Auth）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  email text unique,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro_monthly', 'pro_annual', 'lifetime')),
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: 用户只能读写自己的 profile
alter table public.profiles enable row level security;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 新用户注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 1. 任务表
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  next_action text not null default '',
  type text not null default 'life'
    check (type in ('study', 'research', 'engineering', 'social', 'life', 'recovery')),
  priority text not null default 'important-not-urgent'
    check (priority in ('urgent-important', 'important-not-urgent', 'not-important-not-urgent')),
  pinned boolean not null default false,
  tags text[] not null default '{}',
  deadline timestamptz,
  estimated_minutes int not null default 25,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.tasks enable row level security;
create policy "Users can CRUD own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 2. 日历事件表
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  date date not null,
  type text not null default 'personal'
    check (type in ('exam', 'deadline', 'meeting', 'milestone', 'personal')),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;
create policy "Users can CRUD own calendar_events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 3. 长期规划表
create table if not exists public.strategic_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  question text,
  area text
    check (area in ('advisor', 'course', 'research', 'career', 'life', 'other')),
  horizon text
    check (horizon in ('month', 'semester', 'year')),
  status text not null default 'exploring'
    check (status in ('exploring', 'deciding', 'active', 'paused', 'done')),
  next_review_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.strategic_plans enable row level security;
create policy "Users can CRUD own strategic_plans"
  on public.strategic_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 4. 想法表
create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  tag text not null default 'idea'
    check (tag in ('emotion', 'relationship', 'career', 'research', 'product', 'philosophy', 'writing', 'idea', 'question')),
  status text not null default 'cooling'
    check (status in ('cooling', 'ready', 'processed', 'discarded')),
  created_at timestamptz not null default now(),
  available_at timestamptz not null,
  processed_at timestamptz
);

alter table public.thoughts enable row level security;
create policy "Users can CRUD own thoughts"
  on public.thoughts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 5. 每日状态表
create table if not exists public.daily_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  energy int not null default 3 check (energy between 1 and 5),
  mood int not null default 3 check (mood between 1 and 5),
  focus int not null default 3 check (focus between 1 and 5),
  fatigue int not null default 3 check (fatigue between 1 and 5),
  unique (user_id, date)
);

alter table public.daily_states enable row level security;
create policy "Users can CRUD own daily_states"
  on public.daily_states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 6. 每日复盘表
create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  achieved text not null default '',
  emotion text not null default '',
  adjustment text not null default '',
  unique (user_id, date)
);

alter table public.daily_reviews enable row level security;
create policy "Users can CRUD own daily_reviews"
  on public.daily_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 7. 番茄钟复盘表
create table if not exists public.timer_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid,
  mode_minutes int not null,
  completed_what text not null default '',
  interrupted_by text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now()
);

alter table public.timer_reflections enable row level security;
create policy "Users can CRUD own timer_reflections"
  on public.timer_reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 8. AI 想法总结表
create table if not exists public.thought_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  scope text not null default 'unprocessed'
    check (scope in ('all', 'ready', 'cooling', 'unprocessed')),
  content text not null,
  thought_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.thought_summaries enable row level security;
create policy "Users can CRUD own thought_summaries"
  on public.thought_summaries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 9. 周报表
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.weekly_reports enable row level security;
create policy "Users can CRUD own weekly_reports"
  on public.weekly_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- 10. 今日三件事表
create table if not exists public.today_three (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  slot text not null check (slot in ('must', 'move', 'care')),
  task_id uuid references public.tasks(id) on delete set null,
  unique (user_id, date, slot)
);

alter table public.today_three enable row level security;
create policy "Users can CRUD own today_three"
  on public.today_three for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- 索引（加速常见查询）
-- ============================================================
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed);
create index if not exists idx_tasks_user_deadline on public.tasks(user_id, deadline) where deadline is not null;
create index if not exists idx_thoughts_user_status on public.thoughts(user_id, status);
create index if not exists idx_thoughts_user_available on public.thoughts(user_id, available_at);
create index if not exists idx_daily_states_user_date on public.daily_states(user_id, date);
create index if not exists idx_daily_reviews_user_date on public.daily_reviews(user_id, date);
create index if not exists idx_timer_reflections_user_created on public.timer_reflections(user_id, created_at desc);
create index if not exists idx_calendar_events_user_date on public.calendar_events(user_id, date);
