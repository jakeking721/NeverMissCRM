-- If the column is already there, do nothing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.columns 
    WHERE  table_schema = 'public'
      AND  table_name   = 'campaign_forms'
      AND  column_name  = 'slug'
  ) THEN
    ALTER TABLE public.campaign_forms
      ADD COLUMN slug text;

  END IF;
END $$;

-- Add / replace the unique key (drops it first if it already exists)
ALTER TABLE public.campaign_forms
  DROP CONSTRAINT IF EXISTS campaign_forms_owner_slug_key;

ALTER TABLE public.campaign_forms
  ADD  CONSTRAINT campaign_forms_owner_slug_key
  UNIQUE (owner_id, slug);
