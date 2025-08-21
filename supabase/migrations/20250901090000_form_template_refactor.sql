-- Migration: form template refactor to remove slug/version and add description

alter table public.forms
  drop column if exists slug,
  drop column if exists version,
  add column if not exists description text,
  add column if not exists created_at timestamptz default now();
