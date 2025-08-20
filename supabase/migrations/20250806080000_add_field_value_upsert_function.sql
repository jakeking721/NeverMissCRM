-- Adds helper function to upsert customer custom field values
create or replace function public.upsert_customer_custom_field_value(
    p_customer_id uuid,
    p_field_id uuid,
    p_value text
) returns void language sql as $$
    insert into customer_custom_field_values (customer_id, field_id, value)
    values (p_customer_id, p_field_id, p_value)
    on conflict (customer_id, field_id) do update set value = excluded.value;
$$;
