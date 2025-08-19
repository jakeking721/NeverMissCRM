-- Migration: add email column, allow null phone, normalize data, and add unique indexes

-- 1. helper function for phone normalization
create or replace function public.normalize_phone(input text)
returns text
language plpgsql
immutable
strict
as $$
declare
  digits text;
begin
  if input is null then
    return null;
  end if;
  digits := regexp_replace(input, '\D', '', 'g');
  if digits = '' then
    return null;
  elsif length(digits) = 10 then
    return '+1' || digits;
  elsif length(digits) = 11 and left(digits,1) = '1' then
    return '+' || digits;
  else
    return '+' || digits;
  end if;
end;
$$;

-- 2. schema changes
alter table public.customers add column if not exists email text;
alter table public.customers alter column phone drop not null;
alter table public.customers alter column phone drop default;

-- 3. backfill existing data
update public.customers
set email = nullif(lower(trim(email)), '')
where email is not null;

update public.customers
set phone = normalize_phone(phone)
where phone is not null;

-- capture and null out duplicate emails per user
create table if not exists public.customer_email_collisions (
  user_id uuid,
  email text,
  ids uuid[]
);
insert into public.customer_email_collisions (user_id, email, ids)
select user_id, email, array_agg(id)
from public.customers
where email is not null
group by user_id, email
having count(*) > 1;

update public.customers c
set email = null
from public.customer_email_collisions coll
where c.user_id = coll.user_id and c.email = coll.email and c.id <> coll.ids[1];

-- capture and null out duplicate phones per user
create table if not exists public.customer_phone_collisions (
  user_id uuid,
  phone text,
  ids uuid[]
);
insert into public.customer_phone_collisions (user_id, phone, ids)
select user_id, phone, array_agg(id)
from public.customers
where phone is not null
group by user_id, phone
having count(*) > 1;

update public.customers c
set phone = null
from public.customer_phone_collisions coll
where c.user_id = coll.user_id and c.phone = coll.phone and c.id <> coll.ids[1];

-- 4. recreate intake_add_customer to use normalize_phone
create or replace function public.intake_add_customer(
    p_slug text,
    p_name text,
    p_phone text,
    p_location text default null,
    p_extra jsonb default '{}'::jsonb,
    p_user_id uuid
) returns uuid
language plpgsql
as $$
declare
  v_customer_id uuid;
  v_field_key text;
  v_field_value jsonb;
  v_field_id uuid;
begin
  insert into customers (user_id, name, phone, location, signup_date, extra)
  values (p_user_id, coalesce(p_name, ''), normalize_phone(p_phone), p_location, now(), coalesce(p_extra, '{}'::jsonb))
  returning id into v_customer_id;

  if p_extra ? 'custom_fields' then
    for v_field_key, v_field_value in
      select key, value from jsonb_each(p_extra->'custom_fields')
    loop
      insert into custom_fields (id, user_id, key, label, type)
      values (gen_random_uuid(), p_user_id, v_field_key, v_field_key, 'text')
      on conflict (user_id, key) do nothing
      returning id into v_field_id;

      if v_field_id is null then
        select id into v_field_id from custom_fields where user_id = p_user_id and key = v_field_key;
      end if;

      insert into customer_custom_field_values (customer_id, field_id, value)
      values (v_customer_id, v_field_id, v_field_value::text)
      on conflict (customer_id, field_id) do update set value = excluded.value;
    end loop;
  end if;

  return v_customer_id;
end;
$$;

-- 5. unique indexes on normalized contact info
create unique index if not exists uniq_customers_owner_email_norm
  on public.customers (user_id, lower(trim(email)))
  where email is not null;

create unique index if not exists uniq_customers_owner_phone_e164
  on public.customers (user_id, normalize_phone(phone))
  where phone is not null;
