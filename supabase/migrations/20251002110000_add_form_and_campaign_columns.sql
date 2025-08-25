-- Migration: add form and campaign references to customers and intake_submissions, update RLS and intake_submit

-- 1. Add form_id and campaign_id columns
alter table public.customers
  add column if not exists form_id uuid references campaign_forms(id),
  add column if not exists campaign_id uuid references intake_campaigns(id);

alter table public.intake_submissions
  add column if not exists form_id uuid references campaign_forms(id),
  add column if not exists campaign_id uuid references intake_campaigns(id);

-- 2. RLS policies to permit inserts with new columns
-- Recreate customers_insert policy
DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert ON public.customers
  FOR insert WITH CHECK (
    auth.uid() = user_id AND exists (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_approved AND p.is_active
    )
  );

-- Recreate intake_submissions_owner policy
DROP POLICY IF EXISTS intake_submissions_owner ON public.intake_submissions;
CREATE POLICY intake_submissions_owner ON public.intake_submissions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Updated intake_submit function
CREATE OR REPLACE FUNCTION public.intake_submit(
  p_user_id uuid,
  p_form_id uuid,
  p_campaign_id uuid DEFAULT null,
  p_answers jsonb,
  p_consent_text text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub_id uuid;
  v_cust_id uuid;
  v_phone text := nullif(p_answers->>'f.phone', '');
  v_email text := nullif(p_answers->>'f.email', '');
  v_first text := nullif(p_answers->>'f.first_name', '');
  v_last text := nullif(p_answers->>'f.last_name', '');
  v_zip text := nullif(p_answers->>'f.zip_code', '');
  kv RECORD;
  v_custom jsonb := '{}'::jsonb;
  v_field_name text;
BEGIN
  INSERT INTO intake_submissions(user_id, form_id, campaign_id, answers, consent_text)
    VALUES (p_user_id, p_form_id, p_campaign_id, p_answers, p_consent_text)
    RETURNING id INTO v_sub_id;

  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_cust_id
    FROM customers
    WHERE user_id = p_user_id AND normalize_phone(phone) = normalize_phone(v_phone)
    LIMIT 1;
  END IF;

  IF v_cust_id IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_cust_id
    FROM customers
    WHERE user_id = p_user_id AND lower(trim(email)) = lower(trim(v_email))
    LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    INSERT INTO customers(user_id, first_name, last_name, phone, email, zip_code, consent_text, consent_collected_at, form_id, campaign_id)
      VALUES (p_user_id, coalesce(v_first,''), coalesce(v_last,''), v_phone, v_email, v_zip, p_consent_text,
              CASE WHEN p_consent_text IS NOT NULL THEN now() ELSE NULL END, p_form_id, p_campaign_id)
      RETURNING id INTO v_cust_id;
  ELSE
    UPDATE customers SET
      first_name = coalesce(v_first, first_name),
      last_name = coalesce(v_last, last_name),
      phone = coalesce(v_phone, phone),
      email = coalesce(v_email, email),
      zip_code = coalesce(v_zip, zip_code),
      consent_text = coalesce(p_consent_text, consent_text),
      consent_collected_at = CASE WHEN p_consent_text IS NOT NULL THEN now() ELSE consent_collected_at END,
      form_id = coalesce(form_id, p_form_id),
      campaign_id = coalesce(campaign_id, p_campaign_id)
    WHERE id = v_cust_id;
  END IF;

  UPDATE intake_submissions SET customer_id = v_cust_id WHERE id = v_sub_id;

  FOR kv IN SELECT key, value FROM jsonb_each(p_answers)
  LOOP
    IF kv.value IS NULL OR kv.value::text IN ('null','""','[]','{}') THEN
      CONTINUE;
    END IF;

    INSERT INTO customer_latest_values(user_id, customer_id, data_key, value)
      VALUES (p_user_id, v_cust_id, kv.key, kv.value)
      ON CONFLICT (customer_id, data_key)
      DO UPDATE SET value = excluded.value, updated_at = now();

    IF kv.key LIKE 'f.%' THEN
      CONTINUE;
    END IF;

    v_field_name := CASE WHEN kv.key LIKE 'c.%' THEN substring(kv.key FROM 3) ELSE kv.key END;

    INSERT INTO custom_fields(id, user_id, field_name, type, default_label)
      VALUES (gen_random_uuid(), p_user_id, v_field_name, 'text', v_field_name)
      ON CONFLICT (user_id, field_name) DO UPDATE SET updated_at = now();

    v_custom := v_custom || jsonb_build_object(v_field_name, kv.value);
  END LOOP;

  IF v_custom <> '{}'::jsonb THEN
    UPDATE customers SET extra = coalesce(extra, '{}'::jsonb) || v_custom WHERE id = v_cust_id;
  END IF;

  RETURN v_cust_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.intake_submit(uuid, uuid, uuid, jsonb, text) TO anon;
