-- Allow users to create their own profile row (needed for meal_logs FK).
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, daily_calorie_target, protein_target, carbs_target, fat_target, activity_level, goal)
  values (new.id, 2000, 150, 200, 65, 'moderate', 'lose')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill missing profiles for existing auth users (fixes current FK errors).
insert into public.profiles (id, daily_calorie_target, protein_target, carbs_target, fat_target, activity_level, goal)
select id, 2000, 150, 200, 65, 'moderate', 'lose'
from auth.users
on conflict (id) do nothing;
