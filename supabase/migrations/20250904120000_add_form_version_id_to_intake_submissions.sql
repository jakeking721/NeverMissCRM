-- Migration: add form_version_id to intake_submissions and tighten insert policy

alter table public.intake_submissions
  add column if not exists form_version_id uuid references public.form_versions(id);

-- Replace public insert policy with campaign status/date checks
drop policy if exists intake_submissions_public_insert on public.intake_submissions;
create policy intake_submissions_public_insert on public.intake_submissions
  for insert
  with check (
    exists (
      select 1 from public.intake_campaigns ic
      where ic.id = intake_submissions.campaign_id
        and ic.status = 'active'
        and (ic.start_date is null or now() >= ic.start_date)
        and (ic.end_date is null or now() <= ic.end_date)
    )
  );

-- Ensure anonymous insert access relies on the policy
grant insert on public.intake_submissions to anon;
