create table if not exists public.fasting_sessions (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, started_at timestamptz not null, ended_at timestamptz, goal_hours numeric not null default 16, created_at timestamptz not null default now());
create table if not exists public.grocery_items (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, name text not null, quantity text, is_purchased boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.meal_plans (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, plan_date date not null, meal_type text not null, title text not null, calories numeric not null default 0, created_at timestamptz not null default now());
alter table public.fasting_sessions enable row level security;
alter table public.grocery_items enable row level security;
alter table public.meal_plans enable row level security;
create policy "Users manage own fasting sessions" on public.fasting_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own grocery items" on public.grocery_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own meal plans" on public.meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
