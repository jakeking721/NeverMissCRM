-- Migration: Add campaign fields, forms, submissions
-- Extends campaigns and introduces form versioning and submissions.

-- Extend campaigns table
alter table public.campaigns
  rename column user_id to owner_id;

alter table public.campaigns
  add column if not exists title text,
  add column if not exists slug text,
  add column if not exists type text check (type in ('intake','sms')) default 'sms',
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Forms table
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) not null,
  title text not null,
  schema_json jsonb not null default '{}'::jsonb,
  version int not null,
  created_at timestamptz default now()
);

-- Junction between campaigns and form versions
create table if not exists public.campaign_forms (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  form_id uuid references public.forms(id) on delete cascade,
  form_version int not null,
  primary key (campaign_id, form_id, form_version)
);

-- Form submissions
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  form_id uuid references public.forms(id) on delete cascade,
  form_version int not null,
  payload jsonb not null,
  is_checkin boolean default false,
  customer_id uuid references public.customers(id),
  created_at timestamptz default now()
);

-- Trigger placeholder for future dedupe/tagging logic
create or replace function public.handle_form_submission() returns trigger as $$
begin
  -- TODO: dedupe customers by phone/email and tag with campaign labels
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_handle_form_submission on public.form_submissions;
create trigger trg_handle_form_submission
  after insert on public.form_submissions
  for each row execute function public.handle_form_submission();

-- Enable RLS and basic owner policies
alter table public.forms enable row level security;
create policy "Forms owner access" on public.forms
  for all using (auth.uid() = owner_id);

alter table public.campaign_forms enable row level security;
create policy "Campaign forms owner access" on public.campaign_forms
  for all using (
    auth.uid() = (select owner_id from campaigns c where c.id = campaign_id)
  );

alter table public.form_submissions enable row level security;
create policy "Form submissions owner select" on public.form_submissions
  for select using (
    auth.uid() = (select owner_id from campaigns c where c.id = campaign_id)
  );
create policy "Form submissions owner insert" on public.form_submissions
  for insert with check (
    auth.uid() = (select owner_id from campaigns c where c.id = campaign_id)
  );

-- Allow public read of campaigns by slug for accessing forms
create policy "Campaigns public read" on public.campaigns
  for select using (true);
