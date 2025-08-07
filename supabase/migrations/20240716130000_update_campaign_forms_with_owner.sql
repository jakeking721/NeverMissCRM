-- Migration: add owner_id and unique constraint to campaign_forms

alter table public.campaign_forms
  add column if not exists owner_id uuid not null default auth.uid();

alter table public.campaign_forms
  drop constraint if exists campaign_forms_campaign_id_slug_key;

alter table public.campaign_forms
  add constraint if not exists campaign_forms_owner_slug_key unique (owner_id, slug);

-- Refresh row level security policies
alter table public.campaign_forms enable row level security;

drop policy if exists "campaign_forms_owner_access" on public.campaign_forms;
drop policy if exists "campaign_forms_admin_template_access" on public.campaign_forms;

create or replace policy "campaign_forms_owner_rw" on public.campaign_forms
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace policy "campaign_forms_public_select" on public.campaign_forms
  for select using (true);
