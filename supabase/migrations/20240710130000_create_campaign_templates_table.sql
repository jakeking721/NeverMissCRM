-- Migration: create campaign_templates table

create table if not exists public.campaign_templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists campaign_templates_user_id_idx on public.campaign_templates (user_id);

alter table public.campaign_templates enable row level security;

drop policy if exists "campaign_templates_owner_rw" on public.campaign_templates;
create policy "campaign_templates_owner_rw" on public.campaign_templates
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
