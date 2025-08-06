-- Migration: create custom_fields and campaign_forms tables

-- Create custom_fields table
create table if not exists public.custom_fields (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    key text not null,
    label text not null,
    type text not null,
    options jsonb not null default '[]',
    required boolean not null default false,
    "order" integer not null default 0,
    visible_on jsonb not null default '{"dashboard":false,"customers":false,"campaigns":false}',
    archived boolean not null default false,
    unique (user_id, key)
);

alter table public.custom_fields enable row level security;

create or replace policy "custom_fields_owner" on public.custom_fields
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create campaign_forms table
create table if not exists public.campaign_forms (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null,
    template_id uuid,
    slug text not null,
    schema_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (campaign_id, slug)
);

-- Enable row level security and define policies for campaign_forms
alter table public.campaign_forms enable row level security;

create or replace policy "campaign_forms_owner_access" on public.campaign_forms
    for all using (
        exists (
            select 1
            from campaigns c
            where c.id = campaign_forms.campaign_id
              and c.owner_id = auth.uid()
        )
    );

create or replace policy "campaign_forms_admin_template_access" on public.campaign_forms
    for all using (
        exists (
            select 1
            from campaign_templates t
            where t.id = campaign_forms.template_id
              and t.owner_id = auth.uid()
        )
    );
