-- Migration: create credit_ledger table

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_id_idx on public.credit_ledger(user_id);

alter table public.credit_ledger enable row level security;
create or replace policy "credit_ledger_owner_rw" on public.credit_ledger
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
