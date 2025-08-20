-- Migration: add is_admin function and update profile policies

-- 1. Create security-definer function to check admin role
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

alter function public.is_admin(uid uuid) set row_security = off;

-- 2. Replace profiles policies to use is_admin
create or replace policy "profiles_rw" on public.profiles
  for select using (
    auth.uid() = id or public.is_admin(auth.uid())
  );

create or replace policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id or public.is_admin(auth.uid())
  ) with check (
    auth.uid() = id or public.is_admin(auth.uid())
  );

-- 3. Allow admins to delete profiles
create or replace policy "profiles_delete" on public.profiles
  for delete using (
    public.is_admin(auth.uid())
  );
