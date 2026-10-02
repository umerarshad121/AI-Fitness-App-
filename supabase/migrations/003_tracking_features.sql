alter table public.meal_logs add column if not exists meal_type text not null default 'snack';
alter table public.meal_logs add column if not exists servings numeric not null default 1;
alter table public.meal_logs add column if not exists source text not null default 'manual';

create table if not exists public.custom_foods (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, calories numeric not null, protein numeric not null default 0, carbs numeric not null default 0, fat numeric not null default 0,
  serving_size text, created_at timestamptz not null default now()
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, minutes integer not null, calories_burned numeric not null, performed_at timestamptz not null default now()
);
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null,
  amount_ml integer not null, logged_at timestamptz not null default now()
);
create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, servings numeric not null default 1, calories numeric not null, protein numeric not null default 0, carbs numeric not null default 0, fat numeric not null default 0, created_at timestamptz not null default now()
);

do $$ declare table_name text; begin
  foreach table_name in array array['custom_foods','exercises','water_logs','saved_recipes'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy "Users manage own %s" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name);
  end loop;
exception when duplicate_object then null; end $$;

create index if not exists exercises_user_date_idx on public.exercises(user_id, performed_at desc);
create index if not exists water_logs_user_date_idx on public.water_logs(user_id, logged_at desc);
