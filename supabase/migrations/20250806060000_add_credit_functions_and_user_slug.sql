-- Migration: add credit adjustment and slug helper functions

-- Ensure atomic credit updates
create or replace function public.increment_credits(
    p_user_id uuid,
    p_amount int
) returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_new int;
begin
  select role into v_role from profiles where id = auth.uid();
  if auth.uid() <> p_user_id and v_role <> 'admin' then
    raise exception 'permission denied';
  end if;

  update profiles
    set credits = coalesce(credits, 0) + p_amount
    where id = p_user_id
    returning credits into v_new;

  if not found then
    raise exception 'user not found';
  end if;

  return v_new;
end;
$$;

-- Convenience wrapper for adding credits (positive amounts only)
create or replace function public.add_credits(
    p_user_id uuid,
    p_amount int
) returns int
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  return public.increment_credits(p_user_id, p_amount);
end;
$$;

-- Ensure a user has a public slug; return the row
create or replace function public.ensure_user_slug(
    p_user_id uuid
) returns public.public_slugs
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_row public.public_slugs;
  v_candidate text;
begin
  select role into v_role from profiles where id = auth.uid();
  if auth.uid() <> p_user_id and v_role <> 'admin' then
    raise exception 'permission denied';
  end if;

  select * into v_row from public_slugs where user_id = p_user_id;
  if found then
    return v_row;
  end if;

  select username into v_candidate from profiles where id = p_user_id;
  if v_candidate is null or exists(select 1 from public_slugs where slug = v_candidate) then
    v_candidate := substr(p_user_id::text, 1, 8);
    while exists(select 1 from public_slugs where slug = v_candidate) loop
      v_candidate := substr(gen_random_uuid()::text, 1, 8);
    end loop;
  end if;

  insert into public_slugs (slug, user_id)
    values (v_candidate, p_user_id)
    returning * into v_row;
  return v_row;
end;
$$;
