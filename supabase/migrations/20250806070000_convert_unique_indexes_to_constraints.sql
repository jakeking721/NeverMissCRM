-- Migration: convert unique indexes to constraints on customers.email and customers.phone

-- 1. clean duplicate emails per user (if any)
with email_dupes as (
  select user_id, lower(trim(email)) as email_norm, min(id) as keep_id, array_agg(id) as ids
  from public.customers
  where email is not null
  group by user_id, lower(trim(email))
  having count(*) > 1
)
update public.customers c
set email = null
from email_dupes d
where c.user_id = d.user_id
  and lower(trim(c.email)) = d.email_norm
  and c.id <> d.keep_id;

-- 2. clean duplicate phones per user (if any)
with phone_dupes as (
  select user_id, public.normalize_phone(phone) as phone_norm, min(id) as keep_id, array_agg(id) as ids
  from public.customers
  where phone is not null
  group by user_id, public.normalize_phone(phone)
  having count(*) > 1
)
update public.customers c
set phone = null
from phone_dupes d
where c.user_id = d.user_id
  and public.normalize_phone(c.phone) = d.phone_norm
  and c.id <> d.keep_id;

-- 3. convert unique indexes into constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_customers_owner_email_norm'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT uniq_customers_owner_email_norm
      UNIQUE USING INDEX uniq_customers_owner_email_norm;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_customers_owner_phone_e164'
  ) THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT uniq_customers_owner_phone_e164
      UNIQUE USING INDEX uniq_customers_owner_phone_e164;
  END IF;
END $$;
