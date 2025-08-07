-- Migration: create campaigns table

create table if not exists public.campaigns (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns (user_id);

alter table public.campaigns enable row level security;

drop policy if exists "campaigns_owner_rw" on public.campaigns;
create policy "campaigns_owner_rw" on public.campaigns
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
