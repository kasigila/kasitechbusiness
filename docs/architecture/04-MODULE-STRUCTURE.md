# Folder / Module Structure

```
kasitechbusiness/
├── apps/
│   └── business/                 # Next.js App Router (tenant + command)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (public)/     # login, forgot-password, invite accept
│       │   │   ├── (onboarding)/ # onboarding mode shell
│       │   │   ├── (app)/        # active workspace
│       │   │   ├── (command)/    # KasiTech Command Center
│       │   │   ├── api/          # webhooks, public content API later
│       │   │   ├── layout.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   ├── lib/              # app-local wiring only
│       │   └── middleware.ts
│       └── package.json
├── packages/
│   ├── ui/                       # design system
│   ├── database/                 # migrations + typed client
│   ├── auth/
│   ├── tenancy/
│   ├── permissions/
│   ├── audit/
│   ├── validation/
│   ├── config/                   # tsconfig bases
│   ├── entitlements/             # Phase 2
│   ├── workspace/                # Phase 5
│   ├── cms/                      # Phase 6
│   ├── catalog/                  # Phase 7
│   ├── bookings/                 # Phase 7
│   ├── billing/                  # Phase 9
│   └── ...
├── docs/
│   ├── architecture/
│   └── operations/
├── .github/workflows/
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Boundary rules

| Layer | May import | Must not |
|-------|------------|----------|
| `apps/business` UI | `@kasitech/ui`, domain packages’ public API | raw service-role client in client components |
| Domain packages | `database`, `validation`, `tenancy` | Next.js `app/` routes |
| `database` | env, supabase/postgres drivers | React |
| Client components | UI + typed fetch/actions | secrets, RLS bypass |

## Route map (Phase 1)

| Path | Access |
|------|--------|
| `/login` | Anonymous only |
| `/forgot-password` | Anonymous |
| `/invite/[token]` | Token holder |
| `/app` | Authenticated member (shell) |
| `/command` | Internal roles only |
| `/` | Redirect → login or app |

No `/signup`, `/register`, `/create-account`, `/trial`.
