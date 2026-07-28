# Vendor Lock-in Assessment

## Accepted couplings (mitigated)

| Vendor | Lock-in surface | Escape hatch |
|--------|-----------------|--------------|
| **Supabase Auth** | Auth APIs, JWT claims | Abstract behind `@kasitech/auth`; identities stored in `profiles` keyed by stable user id — migrateable to any OIDC |
| **Supabase Postgres** | Hosting | Standard Postgres + SQL migrations; portable |
| **Supabase RLS helpers** | `auth.uid()` | Equivalent claim injection possible on other hosts |
| **Supabase Storage** | Object paths/policies | Path convention `businesses/{id}/…` portable to S3/R2 |
| **Vercel** | Hosting, ISR/revalidate APIs | Next.js runs elsewhere; wrap `revalidateTag` behind CMS publish port |
| **Inngest** | Job DSL | Job payloads in DB; swap runner later |
| **Resend** | Email API | Mailer interface in notifications package |

## Avoid deepening lock-in

1. Do not put business rules in Supabase Edge Functions as the only copy — keep domain logic in TypeScript packages.
2. Do not use proprietary realtime as the sole correctness mechanism for bookings — DB constraints win.
3. Do not store payment state only in a PSP dashboard — mirror in `payments` / `invoices`.
4. Do not call Vercel-specific APIs outside an adapter.

## Decisions that would create hard lock-in (do not)

- Embedding tenant logic in a no-code vendor
- Using a closed “multi-tenant SaaS kit” that owns schema
- Per-customer forked deployments as the tenancy model
- Client websites querying raw DB with service keys
