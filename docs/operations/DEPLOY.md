# Deploy

## Right now (no Supabase yet)

The app supports **preview mode**: browse login, workspace, and Command Center with demo data.

When Supabase is **not** configured, preview mode serves the UI.  
When you later add Supabase env vars, real auth/data takes over automatically (`isUsingPreviewData` = preview flag AND no Supabase).

### Temporary public URL (cloud agent)

A Cloudflare quick tunnel may be running against the local Next server.  
Check the agent messages for the current `*.trycloudflare.com` link (it changes if the tunnel restarts).

### Permanent host (Vercel — recommended)

1. Import `kasigila/kasitechbusiness` in Vercel.
2. Set **Root Directory** to `apps/business`.
3. Framework: Next.js (install/build commands are in `apps/business/vercel.json`).
4. Environment variables for **preview until Supabase is ready**:

```
NEXT_PUBLIC_PREVIEW_UI=true
ALLOW_PREVIEW_UI=true
NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-DOMAIN
NEXT_PUBLIC_MARKETING_URL=https://kasitechinnovations.com
```

5. Deploy.

### Later — add Supabase (no rewrite needed)

1. Create a Supabase project.
2. Run migrations in order:
   - `packages/database/migrations/0001_foundation.sql`
   - `packages/database/migrations/0002_commercial.sql`
   - `packages/database/migrations/0003_admin_implementation.sql`
3. In Vercel, set:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only
```

4. Optionally turn preview off:

```
NEXT_PUBLIC_PREVIEW_UI=false
ALLOW_PREVIEW_UI=false
```

5. Redeploy.

Login, memberships, Command Center staff roles, Create Business, billing, etc. then use the live database. Preview demo data stops as soon as Supabase URLs are present.
