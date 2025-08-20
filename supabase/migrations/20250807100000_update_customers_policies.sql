-- Migration: update customers policies to require approved and active profiles

-- Reapply customers policies to ensure all operations require
-- user ownership and an approved, active profile
create or replace policy "customers_select" on public.customers
    for select using (
        auth.uid() = user_id and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved and p.is_active
        )
    );

create or replace policy "customers_insert" on public.customers
    for insert with check (
        auth.uid() = user_id and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved and p.is_active
        )
    );

create or replace policy "customers_update" on public.customers
    for update using (
        auth.uid() = user_id and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved and p.is_active
        )
    ) with check (
        auth.uid() = user_id and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved and p.is_active
        )
    );

create or replace policy "customers_delete" on public.customers
    for delete using (
        auth.uid() = user_id and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved and p.is_active
        )
    );
