-- Migration: add updated_at and trigger to customers

alter table public.customers
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_updated_at on public.customers;
create trigger set_updated_at
  before update on public.customers
  for each row
  execute procedure public.update_updated_at_column();
