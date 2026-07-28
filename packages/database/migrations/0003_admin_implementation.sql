-- KasiTech Business — Phase 3 admin / implementation foundation
-- Brand, capabilities, workspace config stubs, implementation projects

-- ---------------------------------------------------------------------------
-- Business brand
-- ---------------------------------------------------------------------------
create table public.business_brand (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  primary_logo_url text,
  icon_logo_url text,
  accent_color text,
  cover_image_url text,
  brand_guidelines_url text,
  custom_terminology jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger business_brand_set_updated_at
before update on public.business_brand
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Capabilities
-- ---------------------------------------------------------------------------
create table public.business_capabilities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  capability_key text not null,
  created_at timestamptz not null default now(),
  unique (business_id, capability_key)
);

create index business_capabilities_business_idx
  on public.business_capabilities (business_id);

-- ---------------------------------------------------------------------------
-- Workspace configuration (composer-ready JSON, validated in app)
-- ---------------------------------------------------------------------------
create table public.workspace_configs (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'RECOMMENDED', 'PUBLISHED')),
  industry_workspace text,
  navigation jsonb not null default '[]'::jsonb,
  widgets jsonb not null default '[]'::jsonb,
  quick_actions jsonb not null default '[]'::jsonb,
  terminology jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  published_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger workspace_configs_set_updated_at
before update on public.workspace_configs
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Implementation projects
-- ---------------------------------------------------------------------------
create table public.implementation_projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  status text not null default 'CONTRACT_SIGNED'
    check (status in (
      'CONTRACT_SIGNED', 'PAYMENT_PENDING', 'DISCOVERY', 'ASSET_COLLECTION',
      'WORKSPACE_CONFIGURATION', 'DESIGN', 'DEVELOPMENT', 'CLIENT_REVIEW',
      'REVISION', 'QA', 'DOMAIN_SETUP', 'TRAINING', 'READY_TO_LAUNCH',
      'LIVE', 'COMPLETE', 'ON_HOLD'
    )),
  progress_percent integer not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  assigned_to uuid references public.profiles (id),
  notes_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index implementation_projects_status_idx
  on public.implementation_projects (status);

create trigger implementation_projects_set_updated_at
before update on public.implementation_projects
for each row execute function public.set_updated_at();

create table public.implementation_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.implementation_projects (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'TODO'
    check (status in ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED', 'CANCELLED')),
  is_client_visible boolean not null default true,
  sort_order integer not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index implementation_tasks_project_idx
  on public.implementation_tasks (project_id, sort_order);

create trigger implementation_tasks_set_updated_at
before update on public.implementation_tasks
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Internal notes (NEVER expose via tenant APIs)
-- ---------------------------------------------------------------------------
create table public.business_internal_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  author_id uuid references public.profiles (id),
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_internal_notes_business_idx
  on public.business_internal_notes (business_id, created_at desc);

create trigger business_internal_notes_set_updated_at
before update on public.business_internal_notes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Social links on businesses (lightweight)
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists instagram text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists owner_name text,
  add column if not exists owner_email text,
  add column if not exists owner_phone text;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.business_brand enable row level security;
alter table public.business_capabilities enable row level security;
alter table public.workspace_configs enable row level security;
alter table public.implementation_projects enable row level security;
alter table public.implementation_tasks enable row level security;
alter table public.business_internal_notes enable row level security;

create policy business_brand_select on public.business_brand
for select to authenticated
using (public.is_business_member(business_id) or public.is_kasitech_staff());

create policy business_brand_write_staff on public.business_brand
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy business_capabilities_select on public.business_capabilities
for select to authenticated
using (public.is_business_member(business_id) or public.is_kasitech_staff());

create policy business_capabilities_write_staff on public.business_capabilities
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy workspace_configs_select on public.workspace_configs
for select to authenticated
using (public.is_business_member(business_id) or public.is_kasitech_staff());

create policy workspace_configs_write_staff on public.workspace_configs
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

-- Implementation: staff full access; clients see project + client-visible tasks only
create policy implementation_projects_select on public.implementation_projects
for select to authenticated
using (public.is_business_member(business_id) or public.is_kasitech_staff());

create policy implementation_projects_write_staff on public.implementation_projects
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy implementation_tasks_select on public.implementation_tasks
for select to authenticated
using (
  public.is_kasitech_staff()
  or (
    is_client_visible = true
    and exists (
      select 1 from public.implementation_projects p
      where p.id = project_id
        and public.is_business_member(p.business_id)
    )
  )
);

create policy implementation_tasks_write_staff on public.implementation_tasks
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

-- Internal notes: staff only — never tenant-visible
create policy business_internal_notes_staff_only on public.business_internal_notes
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());
