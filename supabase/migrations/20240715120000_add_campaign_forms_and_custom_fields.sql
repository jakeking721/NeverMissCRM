-- Migration: add campaign_forms table and deleted flag on custom_fields

-- Create campaign_forms table
create table if not exists public.campaign_forms (
    id uuid primary key default gen_random_uuid(),
<<<<<<< ours
    template_id uuid not null,
    owner_id uuid not null,
    data jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
=======
    campaign_id uuid not null,
    template_id uuid,
    slug text not null,
    schema_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (campaign_id, slug)
>>>>>>> theirs
);

-- Add deleted boolean column to custom_fields
alter table public.custom_fields
    add column if not exists deleted boolean not null default false;

<<<<<<< ours
-- 1️⃣  NEW SECTION: campaign_templates table
create table if not exists public.campaign_templates (
  template_id uuid primary key references public.campaign_forms(id) on delete cascade,
  owner_id    uuid              references auth.users(id)          on delete cascade,
  created_at  timestamptz default now()
);

-- Enable row level security & policies on campaign_forms
alter table public.campaign_forms enable row level security;

create policy "campaign_forms_owner_access" on public.campaign_forms
  for all using (auth.uid() = owner_id);

create policy "campaign_forms_admin_template_access" on public.campaign_forms
  for all using (
    exists (
      select 1
      from campaign_templates t
      where t.template_id = campaign_forms.template_id
        and t.owner_id    = auth.uid()
    )
  );
=======
-- Enable row level security and define policies
alter table public.campaign_forms enable row level security;

create policy "campaign_forms_owner_access" on public.campaign_forms
    for all using (
        exists (
            select 1
            from campaigns c
            where c.id = campaign_forms.campaign_id
              and c.owner_id = auth.uid()
        )
    );

create policy "campaign_forms_admin_template_access" on public.campaign_forms
    for all using (
        exists (
            select 1
            from campaign_templates t
            where t.id = campaign_forms.template_id
              and t.owner_id = auth.uid()
        )
    );
>>>>>>> theirs
