-- Migration: add recipients, status, scheduled_for to campaigns and updated_at trigger

alter table public.campaigns
  add column if not exists recipients text[] default '{}'::text[],
  add column if not exists status text not null default 'draft',
  add column if not exists scheduled_for timestamptz;

-- update updated_at on changes
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.campaigns;
create trigger set_updated_at
  before update on public.campaigns
  for each row
  execute procedure public.update_updated_at_column();
