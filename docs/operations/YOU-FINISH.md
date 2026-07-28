# What only you can finish

These need your accounts / credentials — code is ready to consume them:

1. **Supabase project** — create project, apply migrations `0001`–`0005`, set env vars
2. **Vercel deploy** — connect repo, set env, custom domain `business.kasitechinnovations.com`
3. **Resend** — set `RESEND_API_KEY` + verified `EMAIL_FROM` domain for real invite emails
4. **Payment aggregator** — Selcom / Flutterwave / Pesapal account; set `PAYMENT_PROVIDER_API_KEY` + `PAYMENT_WEBHOOK_SECRET`
5. **First Super Admin** — insert your user into `internal_roles`
6. **Client marketing site wiring** — point live site fetch to `/api/v1/public/{slug}/{locale}/content`
7. **Staging E2E + a11y pass** — run against real staging data

Until then, use preview mode (`NEXT_PUBLIC_PREVIEW_UI=true`) to review UX.
