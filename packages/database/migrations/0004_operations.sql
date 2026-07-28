-- KasiTech Business — Phase 4–9 operational domains
-- Discovery, CMS, catalog, bookings, events, QR, customers, support, analytics

-- ============================================================================
-- DISCOVERY
-- ============================================================================
create table public.discovery_questionnaires (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  status text not null default 'NOT_STARTED'
    check (status in ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discovery_responses (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.discovery_questionnaires (id) on delete cascade,
  section_key text not null,
  question_key text not null,
  answer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (questionnaire_id, section_key, question_key)
);

create table public.workspace_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACCEPTED', 'PUBLISHED', 'REJECTED')),
  recommendation jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- CMS
-- ============================================================================
create table public.website_sites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  name text not null default 'Main site',
  status text not null default 'ONBOARDING'
    check (status in ('ONBOARDING', 'STAGING', 'LIVE')),
  primary_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  site_id uuid not null references public.website_sites (id) on delete cascade,
  title text not null,
  slug text not null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  seo_title text,
  seo_description text,
  version integer not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

create index website_pages_business_idx on public.website_pages (business_id, status);

create table public.website_sections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  page_id uuid not null references public.website_pages (id) on delete cascade,
  section_type text not null,
  sort_order integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.website_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  page_id uuid not null references public.website_pages (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.website_publications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  page_id uuid not null references public.website_pages (id) on delete cascade,
  published_by uuid references public.profiles (id),
  status text not null default 'SUCCESS'
    check (status in ('SUCCESS', 'FAILED')),
  revalidation_status text not null default 'PENDING'
    check (revalidation_status in ('PENDING', 'SUCCESS', 'FAILED')),
  error_message text,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  mime_type text not null,
  size_bytes integer not null default 0,
  storage_path text not null,
  public_url text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index media_assets_business_idx on public.media_assets (business_id, created_at desc);

-- ============================================================================
-- CATALOG
-- ============================================================================
create table public.catalogs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  kind text not null default 'GENERIC'
    check (kind in ('GENERIC', 'MENU', 'SERVICES', 'PRODUCTS', 'EXPERIENCES')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (catalog_id, slug)
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  catalog_id uuid not null references public.catalogs (id) on delete cascade,
  category_id uuid references public.catalog_categories (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price_minor integer,
  currency text not null default 'TZS',
  price_type text not null default 'FIXED'
    check (price_type in ('FIXED', 'FROM', 'VARIABLE', 'FREE')),
  availability text not null default 'AVAILABLE'
    check (availability in ('AVAILABLE', 'UNAVAILABLE', 'SEASONAL')),
  featured boolean not null default false,
  display_order integer not null default 0,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'DRAFT', 'ARCHIVED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id, slug)
);

create index catalog_items_business_idx on public.catalog_items (business_id, status);

-- ============================================================================
-- BOOKINGS / EVENTS
-- ============================================================================
create table public.booking_types (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  key text not null,
  name text not null,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  unique (business_id, key)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  booking_type_id uuid references public.booking_types (id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_email text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  party_size integer,
  status text not null default 'PENDING'
    check (status in (
      'PENDING', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS',
      'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_business_starts_idx
  on public.bookings (business_id, starts_at desc);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  price_minor integer,
  currency text not null default 'TZS',
  featured boolean not null default false,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_business_starts_idx on public.events (business_id, starts_at desc);

-- ============================================================================
-- QR / TABLES / SERVICE REQUESTS
-- ============================================================================
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  label text not null,
  public_token text not null unique,
  destination_type text not null
    check (destination_type in ('menu', 'event', 'booking', 'table', 'service', 'page', 'custom')),
  destination_ref text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  qr_code_id uuid not null references public.qr_codes (id) on delete cascade,
  scanned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  name text not null,
  public_token text not null unique,
  status text not null default 'OPEN'
    check (status in ('OPEN', 'OCCUPIED', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  table_id uuid references public.dining_tables (id) on delete set null,
  request_type text not null
    check (request_type in ('CALL_WAITER', 'REQUEST_BILL', 'REQUEST_WATER', 'CUSTOM_NON_EMERGENCY')),
  status text not null default 'OPEN'
    check (status in ('OPEN', 'ACCEPTED', 'COMPLETED', 'CANCELLED')),
  notes text,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_requests_business_status_idx
  on public.service_requests (business_id, status, created_at desc);

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_idx on public.customers (business_id, created_at desc);

-- ============================================================================
-- ANALYTICS / SUPPORT / NOTIFICATIONS (minimal)
-- ============================================================================
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  location_id uuid references public.locations (id) on delete set null,
  event_type text not null,
  session_id text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_business_created_idx
  on public.analytics_events (business_id, created_at desc);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_by uuid references public.profiles (id),
  category text not null default 'GENERAL',
  subject text not null,
  description text not null,
  priority text not null default 'NORMAL'
    check (priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status text not null default 'OPEN'
    check (status in ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_service_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  requested_by uuid references public.profiles (id),
  request_type text not null
    check (request_type in (
      'WEBSITE_REDESIGN', 'NEW_PAGE', 'CUSTOM_MODULE', 'INTEGRATION',
      'DATA_MIGRATION', 'ADVANCED_REPORTING', 'TRAINING', 'OTHER'
    )),
  subject text not null,
  description text not null,
  status text not null default 'REQUESTED'
    check (status in (
      'REQUESTED', 'SCOPING', 'QUOTED', 'APPROVED',
      'IN_PROGRESS', 'CLIENT_REVIEW', 'COMPLETE', 'DECLINED'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  invoice_number text not null,
  amount_minor integer not null,
  currency text not null default 'TZS',
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PAID', 'FAILED', 'OVERDUE', 'REFUNDED', 'VOID')),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

-- Updated-at triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'discovery_questionnaires', 'discovery_responses', 'workspace_recommendations',
    'website_sites', 'website_pages', 'website_sections',
    'catalogs', 'catalog_items', 'bookings', 'events',
    'qr_codes', 'dining_tables', 'service_requests', 'customers',
    'support_tickets', 'professional_service_requests'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ============================================================================
-- RLS helpers applied to all tenant tables
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'discovery_questionnaires', 'discovery_responses', 'workspace_recommendations',
    'website_sites', 'website_pages', 'website_sections', 'website_versions',
    'website_publications', 'media_assets',
    'catalogs', 'catalog_categories', 'catalog_items',
    'booking_types', 'bookings', 'events',
    'qr_codes', 'qr_scan_events', 'dining_tables', 'service_requests',
    'customers', 'analytics_events',
    'support_tickets', 'professional_service_requests', 'invoices'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Generic member/staff select+write policies for business_id tables
-- (discovery_responses uses questionnaire join)

create or replace function public.policy_business_select(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_business_member(p_business_id) or public.is_kasitech_staff();
$$;

-- Apply standard policies via dynamic SQL for simple business_id tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'discovery_questionnaires', 'workspace_recommendations',
    'website_sites', 'website_pages', 'website_sections', 'website_versions',
    'website_publications', 'media_assets',
    'catalogs', 'catalog_categories', 'catalog_items',
    'booking_types', 'bookings', 'events',
    'qr_codes', 'qr_scan_events', 'dining_tables', 'service_requests',
    'customers', 'analytics_events',
    'support_tickets', 'professional_service_requests', 'invoices'
  ]
  loop
    execute format(
      'create policy %I_select on public.%I for select to authenticated
       using (public.policy_business_select(business_id))',
      t, t
    );
    execute format(
      'create policy %I_write on public.%I for all to authenticated
       using (public.is_kasitech_staff() or public.is_business_member(business_id))
       with check (public.is_kasitech_staff() or public.is_business_member(business_id))',
      t, t
    );
  end loop;
end $$;

create policy discovery_responses_select on public.discovery_responses
for select to authenticated
using (
  exists (
    select 1 from public.discovery_questionnaires q
    where q.id = questionnaire_id
      and public.policy_business_select(q.business_id)
  )
);

create policy discovery_responses_write on public.discovery_responses
for all to authenticated
using (
  exists (
    select 1 from public.discovery_questionnaires q
    where q.id = questionnaire_id
      and (public.is_kasitech_staff() or public.is_business_member(q.business_id))
  )
)
with check (
  exists (
    select 1 from public.discovery_questionnaires q
    where q.id = questionnaire_id
      and (public.is_kasitech_staff() or public.is_business_member(q.business_id))
  )
);
