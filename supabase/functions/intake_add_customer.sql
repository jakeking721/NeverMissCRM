create or replace function public.intake_add_customer(payload jsonb)
returns uuid
language plpgsql
as $$
declare
  v_customer_id uuid;
  v_field_name text;
  v_field_value jsonb;
  v_field_id uuid;
begin
  -- upsert core customer record
  insert into customers (id, data)
  values (
    coalesce((payload->>'id')::uuid, gen_random_uuid()),
    payload - 'custom_fields'
  )
  on conflict (id) do update
    set data = excluded.data
  returning id into v_customer_id;

  -- process custom fields if provided
  if payload ? 'custom_fields' then
    for v_field_name, v_field_value in
      select key, value from jsonb_each(payload->'custom_fields')
    loop
      -- ensure custom field exists
      insert into custom_fields (name)
      values (v_field_name)
      on conflict (name) do nothing
      returning id into v_field_id;

      if v_field_id is null then
        select id into v_field_id from custom_fields where name = v_field_name;
      end if;

      -- upsert value for this customer
      insert into customer_custom_field_values (customer_id, field_id, value)
      values (v_customer_id, v_field_id, v_field_value::text)
      on conflict (customer_id, field_id) do update
        set value = excluded.value;
    end loop;
  end if;

  return v_customer_id;
end;
<<<<<<< ours
$$;
=======
$$;
>>>>>>> theirs
