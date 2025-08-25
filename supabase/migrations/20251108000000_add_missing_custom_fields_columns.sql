alter table public.custom_fields
  add column if not exists required boolean default false,
  add column if not exists "order" integer default 0,
  add column if not exists archived boolean default false,
  add column if not exists visible_on jsonb default '{}'::jsonb,
  add column if not exists user_id uuid;

alter table public.campaign_forms
  add column if not exists user_id uuid,
  add column if not exists title text,
  add column if not exists version int default 1,
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now();
