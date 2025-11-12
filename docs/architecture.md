# ARCHITECTURE.md — Production Blueprint

## Overview
- **Frontend & Backend:** Next.js (App Router) on Vercel
- **Data & Auth:** Supabase (PostgreSQL + RLS + Storage + Auth)
- **ETL Worker:** Python script (`packages/etl/etl_clean_loop.py`) that reads uploaded Excel/CSV, cleans, dedupes, and upserts to final tables.


## Repository Layout
```text
repo/
├─ apps/
│  └─ web/
│     ├─ app/
│     │  ├─ (dashboard)/dashboard/page.tsx
│     │  ├─ imports/page.tsx
│     │  └─ api/
│     │     ├─ imports/route.ts
│     │     ├─ imports/[id]/route.ts
│     │     └─ funnel-2rows/route.ts      # NEW: two-row KPI feed
│     ├─ components/
│     │  ├─ SegmentTabs.tsx
│     │  ├─ StageTwoRowTable.tsx
│     │  ├─ TargetBlocks.tsx
│     │  └─ LopBlocks.tsx
│     └─ lib/
│        ├─ supabase.ts
│        └─ kpi.ts
├─ packages/
│  └─ etl/
│     ├─ etl_clean_loop.py
│     ├─ requirements.txt
│     └─ README.md
└─ supabase/
   ├─ migrations/    # DDL (tables, indexes, SQL view)
   ├─ seed.sql
   └─ policies.sql   # RLS
   ```


## Data Flow (E2E)

1. User uploads file → `/api/imports` → imports row (status=QUEUED) + file in Storage.
2. ETL pulls file → writes raw JSON rows to `stg_raw_rows` → cleans to `stg_clean_rows` (canonical cols) → UPSERT to `companies` & `opportunities` → logs/exports (CSV/XLSX/Parquet).
3. Dashboard queries SQL view `vw_funnel_kpi_per_segment` via `/api/funnel-2rows`.


## Database Schema (Supabase/Postgres)

- **Enums:** `funnel_stage`, `source_division`, `import_status`; roles: `app_role`.
- **Tables:** `tenants`, `users`, `memberships` (for RLS); `imports`, `stg_raw_rows`, `stg_clean_rows`, `companies`, `opportunities`; optional `leads`, `opportunity_stage_history`, `activities`.
- **Uniques & indexes** on canonical keys (e.g., `companies(tenant_id,name_canonical)`), stage/owner indexes.

---

## SQL View for KPI two-row cards

Excerpt is in migrations: `vw_funnel_kpi_per_segment` aggregates `value_M` and projects per stage and provides "Qualified LOP".

---

## ETL Contract

- **Alias Dictionary:** map arbitrary headers to canonical fields; normalize company/project names (upper, strip, punctuation), stage labels, and source divisions.
- **Dedupe Policy:** keep best record by `source_division` priority (BIDDING→MSDC→SALES→MARKETING→OTHER) with timestamp fallback.
- **Script Defaults & Outputs:** header row index defaults to 3; exports CSV/XLSX/Parquet; prints validation metrics.


## API Contracts

### `POST /api/imports`
**Response:** `{ importId }` (creates imports record, stores file)

### `GET /api/imports/:id`
**Response:** `{ status, rows_in, rows_out, links }`

### `GET /api/funnel-2rows?from&to&segment`
**Response type:**
type FunnelTwoRows = {
  segment: string
  leads:      { value_m: number, projects: number }
  prospect:   { value_m: number, projects: number }
  qualified:  { value_m: number, projects: number }
  submission: { value_m: number, projects: number }
  win:        { value_m: number, projects: number }
  qualified_lop: { value_m: number, projects: number } // derived
}
All backed by `vw_funnel_kpi_per_segment`.


## Frontend Structure & Components

- `app/(dashboard)/dashboard/page.tsx` renders segment tabs + five two-row cards + target/LOP blocks.
- **Components:** `SegmentTabs`, `StageTwoRowTable`, `TargetBlocks`, `LopBlocks`.
- **Data Access:** `lib/kpi.ts` → `getFunnelSummary()` calls `/api/funnel-2rows`.


## Security & RLS

- Enable RLS: `companies`, `opportunities`, `activities`, `imports`, and (optionally) staging tables.
- **Policies:** select by tenant claim; write allowed for admin/contributor; ETL uses service role.
- If no `tenant_id` in JWT, join via `memberships`.


## Configuration & Environment

- **Web:** Supabase URL/Anon key; Service role key (server-only).
- **ETL:** `EXCEL_PATH`, `OUTPUT_DIR`, `SHEET_NAME`, `HEADER_ROW_ONE_BASED`.
- **Auth:** JWT embeds `tenant_id` & role (admin/analyst/contributor).


## CI/CD & Operations

- **Deploy:** Vercel via GitHub push; Hobby tier for pilot.
- **Jobs:** GitHub Actions or Vercel Cron for scheduled ETL (if needed).
- **Costs:** pilot Rp0/month; upgrade guidance included.


## Testing & Quality

- **Web:** Vitest/Jest + Testing Library for components; Playwright for E2E.
- **ETL:** Pytest on parsers/normalizers; golden files for sample workbooks.
- **DB:** SQL snapshot tests for `vw_funnel_kpi_per_segment`.


## Roadmap (Post-MVP)

1. Stage history & aging analytics (enable cohort views).
2. Alias dictionary UI under `/settings`.
3. RKAP/STG target tables to compare achievements in KPI view.
