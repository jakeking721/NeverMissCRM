-- Migration: add form template reference and snapshot to campaigns

alter table public.campaigns
  add column if not exists form_template_id uuid references public.forms(id),
  add column if not exists form_snapshot_json jsonb;
