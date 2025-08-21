-- Migration: create intake_submissions table

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.intake_campaigns(id) on delete cascade,
  payload_json jsonb not null,
  submitted_at timestamptz not null default now(),
  customer_id uuid references public.customers(id)
);

alter table public.intake_submissions enable row level security;

create or replace policy "intake_submissions_public_insert" on public.intake_submissions
  for insert
  with check (true);

create or replace policy "intake_submissions_public_update" on public.intake_submissions
  for update
  using (true)
  with check (true);

create or replace policy "intake_submissions_owner_select" on public.intake_submissions
  for select using (
    exists (
      select 1 from intake_campaigns ic
      where ic.id = intake_submissions.campaign_id
        and ic.owner_id = auth.uid()
    )
  );
