-- Migration: drop scheduled_for column and refresh owner policy

alter table public.campaigns drop column if exists scheduled_for;

do $$
begin
  if exists (select 1 from pg_class where relname = 'campaigns_user_id_idx') then
    alter index campaigns_user_id_idx rename to campaigns_owner_id_idx;
  end if;
end$$;

alter table public.campaigns enable row level security;
drop policy if exists "campaigns_owner_rw" on public.campaigns;
create policy "campaigns_owner_rw" on public.campaigns
  for all using (
    auth.uid() = owner_id and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved and p.is_active
    )
  ) with check (
    auth.uid() = owner_id and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved and p.is_active
    )
  );
