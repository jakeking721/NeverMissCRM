-- Ensure customers.extra column and index
alter table public.customers
  add column if not exists extra jsonb not null default '{}'::jsonb;

create index if not exists customers_extra_gin_idx
  on public.customers using gin (extra jsonb_path_ops);

-- Restructure custom_fields table
alter table public.custom_fields drop constraint if exists custom_fields_user_key_unique;

alter table public.custom_fields
  rename column key to field_name;
alter table public.custom_fields
  rename column label to default_label;

alter table public.custom_fields
  drop column if exists required,
  drop column if exists "order",
  drop column if exists "visibleOn",
  drop column if exists archived;

alter table public.custom_fields
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.custom_fields
  add constraint custom_fields_user_field_name_unique unique (user_id, field_name);

alter table public.custom_fields enable row level security;
create or replace policy "custom_fields_owner" on public.custom_fields
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Updated intake_submit function
create or replace function public.intake_submit(
  p_user_id uuid,
  p_campaign_id uuid,
  p_form_version_id uuid,
  p_answers jsonb,
  p_consent_text text default null
) returns uuid
language plpgsql
security definer
as $$
declare
  v_sub_id uuid;
  v_cust_id uuid;
  v_phone text := nullif(p_answers->>'f.phone', '');
  v_email text := nullif(p_answers->>'f.email', '');
  v_first text := nullif(p_answers->>'f.first_name', '');
  v_last text := nullif(p_answers->>'f.last_name', '');
  v_zip text := nullif(p_answers->>'f.zip_code', '');
  kv record;
  v_custom jsonb := '{}'::jsonb;
  v_field_name text;
begin
  insert into intake_submissions(user_id, campaign_id, form_version_id, answers, consent_text)
    values (p_user_id, p_campaign_id, p_form_version_id, p_answers, p_consent_text)
    returning id into v_sub_id;

  if v_phone is not null then
    select id into v_cust_id
    from customers
    where user_id = p_user_id and normalize_phone(phone) = normalize_phone(v_phone)
    limit 1;
  end if;

  if v_cust_id is null and v_email is not null then
    select id into v_cust_id
    from customers
    where user_id = p_user_id and lower(trim(email)) = lower(trim(v_email))
    limit 1;
  end if;

  if v_cust_id is null then
    insert into customers(user_id, first_name, last_name, phone, email, zip_code, consent_text, consent_collected_at)
      values (p_user_id, coalesce(v_first,''), coalesce(v_last,''), v_phone, v_email, v_zip, p_consent_text,
              case when p_consent_text is not null then now() else null end)
      returning id into v_cust_id;
  else
    update customers set
      first_name = coalesce(v_first, first_name),
      last_name = coalesce(v_last, last_name),
      phone = coalesce(v_phone, phone),
      email = coalesce(v_email, email),
      zip_code = coalesce(v_zip, zip_code),
      consent_text = coalesce(p_consent_text, consent_text),
      consent_collected_at = case when p_consent_text is not null then now() else consent_collected_at end
    where id = v_cust_id;
  end if;

  update intake_submissions set customer_id = v_cust_id where id = v_sub_id;

  for kv in select key, value from jsonb_each(p_answers)
  loop
    if kv.value is null or kv.value::text in ('null','""','[]','{}') then
      continue;
    end if;

    insert into customer_latest_values(user_id, customer_id, data_key, value)
      values (p_user_id, v_cust_id, kv.key, kv.value)
      on conflict (customer_id, data_key)
      do update set value = excluded.value, updated_at = now();

    if kv.key like 'f.%' then
      continue;
    end if;

    v_field_name := case when kv.key like 'c.%' then substring(kv.key from 3) else kv.key end;

    insert into custom_fields(id, user_id, field_name, type, default_label)
      values (gen_random_uuid(), p_user_id, v_field_name, 'text', v_field_name)
      on conflict (user_id, field_name) do update set updated_at = now();

    v_custom := v_custom || jsonb_build_object(v_field_name, kv.value);
  end loop;

  if v_custom <> '{}'::jsonb then
    update customers set extra = coalesce(extra, '{}'::jsonb) || v_custom where id = v_cust_id;
  end if;

  return v_cust_id;
end;
$$;

grant execute on function public.intake_submit(uuid, uuid, uuid, jsonb, text) to anon;

-- Backfill customers.extra from existing intake_submissions
DO $$
DECLARE
  r record;
  kv record;
  v_field_name text;
  v_extra jsonb;
BEGIN
  FOR r IN select user_id, answers, customer_id from intake_submissions where customer_id is not null LOOP
    v_extra := '{}'::jsonb;
    FOR kv IN select key, value from jsonb_each(r.answers) LOOP
      IF kv.key like 'f.%' THEN
        CONTINUE;
      END IF;
      v_field_name := case when kv.key like 'c.%' then substring(kv.key from 3) else kv.key end;
      insert into custom_fields(id, user_id, field_name, type, default_label)
        values (gen_random_uuid(), r.user_id, v_field_name, 'text', v_field_name)
        on conflict (user_id, field_name) do update set updated_at = now();
      v_extra := v_extra || jsonb_build_object(v_field_name, kv.value);
    END LOOP;
    IF v_extra <> '{}'::jsonb THEN
      update customers set extra = coalesce(extra, '{}'::jsonb) || v_extra where id = r.customer_id;
    END IF;
  END LOOP;
END
$$;
