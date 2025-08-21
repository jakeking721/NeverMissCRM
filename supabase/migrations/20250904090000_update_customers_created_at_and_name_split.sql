-- Migration: rename signup_date to created_at and split name fields

alter table public.customers
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists zip_code text;

update public.customers
set
  first_name = coalesce(first_name, split_part(name, ' ', 1)),
  last_name = coalesce(last_name, trim(split_part(name, ' ', 2))),
  zip_code = coalesce(zip_code, location);

-- rename signup_date to created_at if present
DO $$
BEGIN
  IF exists (
    select 1 from information_schema.columns
    where table_name = 'customers' and column_name = 'signup_date'
  ) THEN
    alter table public.customers rename column signup_date to created_at;
  END IF;
END$$;

alter table public.customers drop column if exists name;
alter table public.customers drop column if exists location;

alter table public.customers
  alter column first_name set default '',
  alter column last_name set default '',
  alter column created_at set default now();

-- redefine intake_add_customer with new columns
create or replace function public.intake_add_customer(
    p_slug text,
    p_first_name text,
    p_last_name text,
    p_phone text,
    p_zip_code text default null,
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
  insert into customers (user_id, first_name, last_name, phone, zip_code, created_at, extra)
  values (p_user_id, coalesce(p_first_name,''), coalesce(p_last_name,''), normalize_phone(p_phone), p_zip_code, now(), coalesce(p_extra, '{}'::jsonb))
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
