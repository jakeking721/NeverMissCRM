-- Adds intake submissions answers column, customer_latest_values, and consent auditing

-- 1. intake_submissions with answers jsonb and owner column
create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  campaign_id uuid references intake_campaigns(id),
  form_version_id uuid references form_versions(id),
  answers jsonb not null,
  customer_id uuid,
  consent_text text,
  submitted_at timestamptz default now()
);

create index if not exists intake_submissions_user_idx on public.intake_submissions(user_id);
create index if not exists intake_submissions_campaign_idx on public.intake_submissions(campaign_id);

alter table public.intake_submissions enable row level security;
create policy intake_submissions_owner on public.intake_submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. customer_latest_values table
create table if not exists public.customer_latest_values (
  user_id uuid references auth.users(id) not null,
  customer_id uuid references customers(id) on delete cascade,
  data_key text not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  primary key (customer_id, data_key)
);

create index if not exists clv_user_key_idx on public.customer_latest_values(user_id, data_key);

alter table public.customer_latest_values enable row level security;
create policy customer_latest_values_owner on public.customer_latest_values
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. consent audit columns on customers
alter table public.customers
  add column if not exists consent_text text,
  add column if not exists consent_collected_at timestamptz;

-- 4. intake_submit RPC to upsert customers and latest values
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
  end loop;

  return v_cust_id;
end;
$$;

grant execute on function public.intake_submit(uuid, uuid, uuid, jsonb, text) to anon;
