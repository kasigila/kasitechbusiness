# Threat Model — KasiTech Business (Phase 0)

## Assets

- Tenant operational data (catalog, bookings, customers, CMS drafts)
- Auth credentials & sessions
- Billing records
- Internal notes / commercial data
- Media library objects
- Audit logs

## Actors

| Actor | Trust |
|-------|-------|
| Anonymous | Untrusted |
| Invited user (pending) | Limited |
| Business member | Tenant-scoped |
| Business owner | Tenant admin |
| KasiTech staff | Elevated, audited |
| Attacker with stolen session | Compromised member |
| Malicious tenant admin | Trusted within tenant only |

## Top abuse cases

1. Tenant A enumerates Tenant B IDs
2. Staff token misuse without audit
3. Invitation token brute force / replay
4. CMS content used for stored XSS on public sites
5. Upload malware / HTML disguised as image
6. Billing webhook replay → double credit
7. Disabled UI feature called via API (entitlement bypass)

## Mitigations mapped to phases

See `08-SECURITY.md` and phase checklists. Phase 1 focuses on auth boundary, memberships, RLS, audit, no public signup.
