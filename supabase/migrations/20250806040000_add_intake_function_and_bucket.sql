-- Migration: add intake_add_customer function and form-uploads bucket

-- Create or replace intake_add_customer function
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
  -- insert core customer record
  insert into customers (user_id, name, phone, location, signup_date, extra)
  values (p_user_id, coalesce(p_name, ''), coalesce(p_phone, ''), p_location, now(), coalesce(p_extra, '{}'::jsonb))
  returning id into v_customer_id;

  -- process custom fields if provided
  if p_extra ? 'custom_fields' then
    for v_field_key, v_field_value in
      select key, value from jsonb_each(p_extra->'custom_fields')
    loop
      -- ensure custom field exists
      insert into custom_fields (id, user_id, key, label, type)
      values (gen_random_uuid(), p_user_id, v_field_key, v_field_key, 'text')
      on conflict (user_id, key) do nothing
      returning id into v_field_id;

      if v_field_id is null then
        select id into v_field_id from custom_fields where user_id = p_user_id and key = v_field_key;
      end if;

      -- upsert value for this customer
      insert into customer_custom_field_values (customer_id, field_id, value)
      values (v_customer_id, v_field_id, v_field_value::text)
      on conflict (customer_id, field_id) do update set value = excluded.value;
    end loop;
  end if;

  return v_customer_id;
end;
$$;

-- Ensure storage bucket exists for form uploads
insert into storage.buckets (id, name, public)
select 'form-uploads', 'form-uploads', false
where not exists (select 1 from storage.buckets where id = 'form-uploads');
