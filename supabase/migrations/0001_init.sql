-- Base schema for Infomedia dashboard (minimal runnable snapshot)
--
-- Replace/extend these objects with your production migrations as the ETL solidifies.

-- Enable uuid generator
create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  role text default 'admin',
  created_at timestamptz default now()
);

create table if not exists leads (
  lead_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_name text,
  pic text,
  segment text,
  channel text,
  need_description text,
  tender_name text,
  project_value_m numeric,
  status_tender text,
  created_at timestamptz default now()
);
create index if not exists leads_tenant_created_idx on leads (tenant_id, created_at desc);

create table if not exists funnel_stage_metrics (
  tenant_id uuid not null references tenants(id) on delete cascade,
  segment text not null,
  stage text not null,
  project_count numeric,
  total_m numeric,
  constraint funnel_stage_metrics_pk primary key (tenant_id, segment, stage)
);

create table if not exists lop_target_metrics (
  tenant_id uuid not null references tenants(id) on delete cascade,
  year integer not null default date_part('year', now()),
  segment text not null,
  target_rkap_m numeric,
  target_stg_m numeric,
  kecukupan_lop_m numeric,
  qualified_lop_m numeric,
  kecukupan_vs_rkap_pct numeric,
  kecukupan_vs_stg_pct numeric,
  qualified_vs_rkap_pct numeric,
  qualified_vs_stg_pct numeric,
  constraint lop_target_metrics_pk primary key (tenant_id, year, segment)
);

create view if not exists vw_funnel_kpi_per_segment as
select * from funnel_stage_metrics;

create view if not exists vw_lop_vs_target_per_segment as
select * from lop_target_metrics;

-- Basic RLS to isolate tenants (service_role bypasses by default)
alter table leads enable row level security;
alter table funnel_stage_metrics enable row level security;
alter table lop_target_metrics enable row level security;
alter table memberships enable row level security;

create policy if not exists leads_tenant_select on leads for select
  using ((auth.jwt()->>'tenant_id')::uuid = tenant_id);
create policy if not exists leads_tenant_write on leads for insert, update
  with check ((auth.jwt()->>'tenant_id')::uuid = tenant_id or auth.role() = 'service_role');

create policy if not exists funnel_metrics_select on funnel_stage_metrics for select
  using ((auth.jwt()->>'tenant_id')::uuid = tenant_id);
create policy if not exists funnel_metrics_write on funnel_stage_metrics for insert, update
  with check ((auth.jwt()->>'tenant_id')::uuid = tenant_id or auth.role() = 'service_role');

create policy if not exists lop_metrics_select on lop_target_metrics for select
  using ((auth.jwt()->>'tenant_id')::uuid = tenant_id);
create policy if not exists lop_metrics_write on lop_target_metrics for insert, update
  with check ((auth.jwt()->>'tenant_id')::uuid = tenant_id or auth.role() = 'service_role');

create policy if not exists memberships_select on memberships for select
  using ((auth.jwt()->>'sub')::uuid = user_id);
