-- Intake flow migration
-- Creates form_versions table, augments intake_campaigns, adds intake_submissions, resolver view and RPCs

-- 1. form_versions table
create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references campaign_forms(id) on delete cascade,
  owner_id uuid references auth.users(id) not null,
  version_number int not null,
  schema_json jsonb not null,
  version_label text,
  created_at timestamptz default now(),
  unique(form_id, version_number)
);

-- 2. intake_campaigns table
create table if not exists public.intake_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) not null,
  title text not null,
  slug text not null,
  form_version_id uuid references form_versions(id),
  form_snapshot_json jsonb,
  start_date date,
  end_date date,
  status text default 'draft',
  gate_field text default 'phone',
  prefill_gate boolean default false,
  success_message text,
  require_consent boolean default false,
  created_at timestamptz default now(),
  unique(owner_id, slug)
);

-- 3. intake_submissions table
create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references intake_campaigns(id),
  form_version_id uuid references form_versions(id),
  payload_json jsonb not null,
  customer_id uuid,
  submitted_at timestamptz default now()
);

alter table public.intake_submissions enable row level security;

create policy "intake_submissions_anon_insert" on public.intake_submissions
for insert to anon
with check (
  exists (
    select 1 from intake_campaigns ic
    where ic.id = intake_submissions.campaign_id
      and ic.status = 'active'
      and (ic.start_date is null or ic.start_date <= now())
      and (ic.end_date is null or ic.end_date >= now())
  )
);

create policy "intake_submissions_anon_update" on public.intake_submissions
for update to anon
using (true) with check (true);

create policy "intake_submissions_owner_select" on public.intake_submissions
for select to authenticated
using (
  exists (
    select 1 from intake_campaigns ic
    where ic.id = intake_submissions.campaign_id
      and ic.owner_id = auth.uid()
  )
);

-- 4. intake_resolver view
create or replace view public.intake_resolver as
select ic.id as campaign_id,
       ic.owner_id,
       ic.form_version_id,
       coalesce(ic.form_snapshot_json, fv.schema_json) as form_json,
       ic.slug,
       ic.status,
       ic.start_date,
       ic.end_date,
       ic.gate_field,
       ic.prefill_gate,
       ic.success_message,
       ic.require_consent
from intake_campaigns ic
left join form_versions fv on fv.id = ic.form_version_id;

grant select on public.intake_resolver to anon;

-- 5. RPCs
create or replace function public.intake_find_customer(owner_id uuid, gate text, value text)
returns uuid
language sql security definer as $$
  select c.id
  from customers c
  where c.user_id = owner_id
    and (case gate when 'email' then c.email else c.phone end) = value
  limit 1;
$$;

grant execute on function public.intake_find_customer(uuid, text, text) to anon;

create or replace function public.intake_add_customer(
  p_slug text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_zip_code text,
  p_extra jsonb,
  p_user_id uuid
) returns uuid
language plpgsql security definer as $$
declare existing uuid;
begin
  existing := intake_find_customer(p_user_id, 'phone', p_phone);
  if existing is not null then
    return existing;
  end if;
  insert into customers (slug, first_name, last_name, phone, zip_code, extra, user_id)
    values (p_slug, p_first_name, p_last_name, p_phone, p_zip_code, p_extra, p_user_id)
    returning id into existing;
  return existing;
end;
$$;

grant execute on function public.intake_add_customer(text, text, text, text, text, jsonb, uuid) to anon;
