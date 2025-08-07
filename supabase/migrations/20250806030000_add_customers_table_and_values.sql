-- Migration: create customers and customer_custom_field_values tables

-- 1. Customers table
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null default '',
    phone text not null default '',
    location text,
    signup_date timestamptz not null default now(),
    extra jsonb not null default '{}'::jsonb
);

create index if not exists customers_user_id_idx on public.customers(user_id);

alter table public.customers enable row level security;

create policy "customers_select" on public.customers
    for select using (auth.uid() = user_id);
create policy "customers_insert" on public.customers
    for insert with check (auth.uid() = user_id);
create policy "customers_update" on public.customers
    for update using (auth.uid() = user_id);
create policy "customers_delete" on public.customers
    for delete using (auth.uid() = user_id);

-- 2. Join table for custom field values
create table if not exists public.customer_custom_field_values (
    customer_id uuid not null references public.customers(id) on delete cascade,
    field_id uuid not null references public.custom_fields(id) on delete cascade,
    value text not null default '',
    primary key (customer_id, field_id)
);

alter table public.customer_custom_field_values enable row level security;

create policy "customer_custom_field_values_owner" on public.customer_custom_field_values
    for all using (
        exists (
            select 1 from public.customers c
            where c.id = customer_id and c.user_id = auth.uid()
        )
    ) with check (
        exists (
            select 1 from public.customers c
            where c.id = customer_id and c.user_id = auth.uid()
        )
    );

-- Optional index for faster lookups
create index if not exists ccfv_customer_idx on public.customer_custom_field_values(customer_id);
