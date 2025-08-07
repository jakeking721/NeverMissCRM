-- Migration: ensure slug column and unique constraint on campaign_forms

alter table public.campaign_forms
  add column if not exists slug text;

alter table public.campaign_forms
  drop constraint if exists campaign_forms_owner_slug_key;

alter table public.campaign_forms
  drop constraint if exists campaign_forms_campaign_slug_unique;

alter table public.campaign_forms
  drop constraint if exists campaign_forms_campaign_id_slug_key;

alter table public.campaign_forms
  add constraint if not exists campaign_forms_campaign_id_slug_key
  unique (campaign_id, slug);
