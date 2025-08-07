-- Migration: create public_slugs table

create table if not exists public.public_slugs (
    slug text primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create index if not exists public_slugs_user_id_idx on public.public_slugs (user_id);

alter table public.public_slugs enable row level security;

drop policy if exists "public_slugs_owner_rw" on public.public_slugs;
create policy "public_slugs_owner_rw" on public.public_slugs
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "public_slugs_public_select" on public.public_slugs;
create policy "public_slugs_public_select" on public.public_slugs
    for select using (true);
