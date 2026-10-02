create extension if not exists pgcrypto;

alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists weight_kg numeric;
alter table public.profiles add column if not exists target_weight_kg numeric;
alter table public.profiles add column if not exists daily_calorie_target integer;
alter table public.profiles add column if not exists protein_target integer;
alter table public.profiles add column if not exists carbs_target integer;
alter table public.profiles add column if not exists fat_target integer;

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can manage own meal logs" on public.meal_logs;
create policy "Users can manage own meal logs" on public.meal_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can manage own weight logs" on public.weight_logs;
create policy "Users can manage own weight logs" on public.weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists meal_logs_user_logged_at_idx on public.meal_logs(user_id, logged_at desc);
create index if not exists weight_logs_user_date_idx on public.weight_logs(user_id, recorded_date desc);
