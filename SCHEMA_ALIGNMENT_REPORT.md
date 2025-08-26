# Schema Alignment Report

## Overview
This update aligns the app with recent Supabase schema changes.

## Changes
- `campaign_forms` now uses `user_id` instead of `owner_id` and requires a unique `slug` per user.
- `intake_campaigns.slug` is nullable; UI guards actions when a slug is absent.
- Anonymous intake reads rely on the `intake_resolver` view, consuming `form_json` directly.
- `customers.extra` is enforced as non-null JSON across all writes.

## Updated Files
- `src/services/forms.ts`
- `src/pages/forms/Edit.tsx`
- `src/services/intakeCampaignService.ts`
- `src/pages/campaigns/intake/New.tsx`
- `src/pages/campaigns/intake/List.tsx`
- `src/pages/intake/IntakeRenderer.tsx`
- `src/services/intake.ts`
- `src/services/customerService.ts`
- `src/types/supabase.ts`
- `SUPABASE_SCHEMA_SPEC.txt`
- `Latest TODO's for Jake`
- `CHANGELOG.md`

## Adapters & Notes
- Slug fields are auto-normalized and checked for uniqueness per user.
- Intake flows no longer access `form_versions` directly; all public reads go through views.
- Customer updates always merge an object into `extra` to satisfy non-null constraints.

