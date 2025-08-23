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
