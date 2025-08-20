-- Migration: add profile approval flags

-- 1. Add columns to profiles
alter table public.profiles
  add column if not exists is_approved boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists deactivated_at timestamptz null;

-- 2. Ensure profiles RLS allows owner or admins
alter table public.profiles enable row level security;
create or replace policy "profiles_rw" on public.profiles
  for select using (
    auth.uid() = id or exists (
      select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'
    )
  );
create or replace policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id or exists (
      select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'
    )
  ) with check (
    auth.uid() = id or exists (
      select 1 from public.profiles p2 where p2.id = auth.uid() and p2.role = 'admin'
    )
  );

-- 3. Update handle_new_user trigger to set flags
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, role, credits, avatar, is_approved, is_active)
  values (new.id, new.email, new.raw_user_meta_data->>'username', 'user', 0, '', false, true)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Optional hardening: ensure writes only when profile approved & active
create or replace policy "campaigns_owner_rw" on public.campaigns
  for all using (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and is_approved and is_active
    )
  ) with check (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and is_approved and is_active
    )
  );

create or replace policy "customers_insert" on public.customers
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and is_approved and is_active
    )
  );

create or replace policy "customers_update" on public.customers
  for update using (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and is_approved and is_active
    )
  ) with check (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and is_approved and is_active
    )
  );
