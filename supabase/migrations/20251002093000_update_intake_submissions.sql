-- Migration: update intake_submissions rename columns and enforce constraints

-- 1. Rename legacy columns if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_submissions' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.intake_submissions RENAME COLUMN owner_id TO user_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'intake_submissions' AND column_name = 'payload_json'
  ) THEN
    ALTER TABLE public.intake_submissions RENAME COLUMN payload_json TO answers;
  END IF;
END $$;

-- 2. Column additions and constraints
ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS consent_text text,
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN answers TYPE jsonb USING answers::jsonb,
  ALTER COLUMN answers SET NOT NULL,
  ALTER COLUMN campaign_id TYPE uuid USING campaign_id::uuid,
  ALTER COLUMN form_version_id TYPE uuid USING form_version_id::uuid,
  ALTER COLUMN customer_id TYPE uuid USING customer_id::uuid,
  ALTER COLUMN submitted_at TYPE timestamptz USING submitted_at::timestamptz,
  ALTER COLUMN submitted_at SET DEFAULT now();

-- 3. Foreign keys
ALTER TABLE public.intake_submissions
  ADD CONSTRAINT IF NOT EXISTS intake_submissions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
  ADD CONSTRAINT IF NOT EXISTS intake_submissions_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES public.intake_campaigns(id),
  ADD CONSTRAINT IF NOT EXISTS intake_submissions_form_version_id_fkey
    FOREIGN KEY (form_version_id) REFERENCES public.form_versions(id),
  ADD CONSTRAINT IF NOT EXISTS intake_submissions_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- 4. Indexes
DROP INDEX IF EXISTS intake_submissions_owner_idx;
DROP INDEX IF EXISTS intake_submissions_user_idx;
DROP INDEX IF EXISTS intake_submissions_campaign_idx;
CREATE INDEX intake_submissions_user_idx ON public.intake_submissions(user_id);
CREATE INDEX intake_submissions_campaign_idx ON public.intake_submissions(campaign_id);

-- 5. Row level security
ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS intake_submissions_anon_insert ON public.intake_submissions;
DROP POLICY IF EXISTS intake_submissions_anon_update ON public.intake_submissions;
DROP POLICY IF EXISTS intake_submissions_public_insert ON public.intake_submissions;
DROP POLICY IF EXISTS intake_submissions_owner_select ON public.intake_submissions;
DROP POLICY IF EXISTS intake_submissions_owner ON public.intake_submissions;
CREATE POLICY intake_submissions_owner ON public.intake_submissions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
