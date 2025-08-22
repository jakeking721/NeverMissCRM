-- Migration: create form_versions table and update intake_campaigns

create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms(id) on delete cascade,
  owner_id uuid references auth.users(id) not null,
  version_number int not null,
  schema_json jsonb not null default '{}'::jsonb,
  version_label text not null,
  created_at timestamptz default now(),
  unique (form_id, version_number)
);

alter table public.forms
  drop column if exists schema_json;

alter table public.intake_campaigns
  drop column if exists form_id,
  add column if not exists form_version_id uuid references public.form_versions(id),
  add column if not exists form_snapshot_json jsonb;

alter table public.form_versions enable row level security;
create policy "Form versions owner rw" on public.form_versions
  for all using (auth.uid() = owner_id);

-- Backfill version_label for existing versions
update public.form_versions fv
set version_label = coalesce(f.title, 'Form') || ' v' || fv.version_number
from public.forms f
where fv.form_id = f.id
  and (fv.version_label is null or fv.version_label = '');
