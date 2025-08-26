# Changelog

## Unreleased
- fix: route form saves through Supabase client using `campaign_forms` table and improved error reporting.
- fix: restore intake campaign editing and ensure QR slugs resolve to linked forms.
- feat: migrate `campaign_forms` to `user_id` with required, per-user unique slugs.
- feat: support nullable `intake_campaigns.slug` and guard slug-dependent actions.
- feat: load public intake forms via `intake_resolver.form_json` instead of direct `form_versions` queries.
- chore: enforce non-null `customers.extra` and normalize contact lookups.
