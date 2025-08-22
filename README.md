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
