-- Migration: create custom_fields and campaign_forms tables

create table if not exists public.custom_fields (
    id uuid primary key
);

alter table public.custom_fields
    add column if not exists user_id uuid not null references auth.users(id) on delete cascade;

alter table public.custom_fields
    add column if not exists key text not null;

alter table public.custom_fields
    add column if not exists label text not null;

alter table public.custom_fields
    add column if not exists type text not null;

alter table public.custom_fields
    add column if not exists options jsonb not null default '[]';

alter table public.custom_fields
    add column if not exists required boolean not null default false;

alter table public.custom_fields
    add column if not exists "order" integer not null default 0;

alter table public.custom_fields
    add column if not exists visible_on jsonb not null default '{"dashboard":false,"customers":false,"campaigns":false}';

alter table public.custom_fields
    add column if not exists archived boolean not null default false;

alter table public.custom_fields
    add constraint if not exists custom_fields_user_key_unique unique (user_id, key);

alter table public.custom_fields enable row level security;
create or replace policy "custom_fields_owner" on public.custom_fields
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.campaign_forms (
    id uuid primary key default gen_random_uuid()
);

alter table public.campaign_forms
    add column if not exists campaign_id uuid not null;

alter table public.campaign_forms
    add column if not exists template_id uuid;

alter table public.campaign_forms
    add column if not exists slug text not null;

alter table public.campaign_forms
    add column if not exists schema_json jsonb not null default '{}'::jsonb;

alter table public.campaign_forms
    add column if not exists created_at timestamptz not null default now();

alter table public.campaign_forms
    add column if not exists updated_at timestamptz not null default now();

alter table public.campaign_forms
    add constraint if not exists campaign_forms_campaign_slug_unique unique (campaign_id, slug);

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
