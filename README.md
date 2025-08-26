# NeverMissCRM

A CRM and intake campaign platform.

## QR Domain & Intake Routing

Set `VITE_QR_BASE_URL` in your environment to the canonical domain used in QR codes.
This base URL is used when generating links for `/intake/:slug` routes. For example:

```
VITE_QR_BASE_URL=https://qr.example.com
```

During development you can omit this variable and the app will fall back to
`VITE_PUBLIC_APP_URL` or the current browser origin.
Ensure your hosting setup serves the SPA on this domain with refresh-safe rewrites
for `/intake/*` paths.

## Customer Column Preferences

The Customers page lets each user choose which columns are visible and in what
order. Preferences are saved per-account in `profiles.settings.customerColumns`
as an ordered list of data keys:

- Built-in fields use the `f.` prefix (e.g. `f.first_name`, `f.email`).
- Custom fields use `c.<field_id>` where `<field_id>` is the UUID from the
  `custom_fields` table.

When loading, the app maps these data keys back to UI column keys and renders
missing values as `—`.

## Supabase RLS Smoke Tests

Integration tests verify anonymous submission flows and row level security.

### Setup

1. Create two Supabase users: an **owner** with an active intake campaign and an **other** user with no access to the owner's data.
2. Note a campaign slug that resolves through `intake_resolver`.
3. Provide the following environment variables (e.g. in `.env.test`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
TEST_OWNER_EMAIL=...
TEST_OWNER_PASSWORD=...
TEST_OTHER_EMAIL=...
TEST_OTHER_PASSWORD=...
TEST_CAMPAIGN_SLUG=...
```

### Run

Execute the smoke tests with:

```
npm test
```

If the variables are missing, the RLS tests are skipped. When configured, the tests submit an intake anonymously, then verify that rows were created and that non-owners cannot read them.

### Troubleshooting

- Ensure the slug points to an active campaign and form.
- Confirm credentials for both test users.
- If a run fails, check the Supabase dashboard for leftover test rows in `customers`, `intake_submissions`, and `customer_latest_values` and remove them.
