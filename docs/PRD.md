# PRD — Sales Funnel Web Dashboard (Next.js + Supabase)

## 1. Summary

A web dashboard for Marketing, Sales, MSDC, and Bidding to upload Excel/CSV, run a standardized ETL, and monitor a B2B sales funnel (Leads → Prospect → Qualified → Submission → Win) with KPI cards, drilldown tables, and segment tabs (Telkom Group, SOE, Private, GOV, SME & Reg).

**Tech:** Next.js (App Router) on Vercel; PostgreSQL + Auth + Storage via Supabase; Python ETL worker.

## 2. Goals & Non-Goals

### Goals

- One consistent source of truth for companies and opportunities across all divisions.
- Zero-friction data ingestion: users upload Excel/CSV; ETL normalizes, dedupes, and upserts to final tables.
- KPI "two-row cards" per funnel stage (value in millions & project count) + segment tabs; drilldown views.

### Non-Goals

- Full CRM replacement (we keep a minimal activities log only).
- Complex lead scoring/AI—out of MVP.

## 3. Users & Personas

- **Management:** wants KPI overview, target attainment (RKAP/STG), quick export.
- **Marketing:** cares about sources, city heat, top channels.
- **Sales/MSDC/Bidding:** pipeline by stage, aging, SLA, and conversion.

## 4. Scope (MVP)

- **Uploads:** `/imports` page, `POST /api/imports` (multipart) → creates an imports ticket and stores file.
- **ETL:** Raw rows → `stg_raw_rows` (json), Clean rows → `stg_clean_rows` (canonicalized), then UPSERT to `companies` and `opportunities`.
- **KPI View & Endpoint:** SQL view `vw_funnel_kpi_per_segment` feeding `GET /api/funnel-2rows` for two-row stage cards (Value_M and Projects) and Qualified LOP (Qualified+Submission+Win).
- **Auth & RLS:** Multi-tenant; row access restricted to tenant; writes via service role/ETL; roles: admin/analyst/contributor.

## 5. Core Definitions & KPIs

- **Funnel stages:** Leads, Prospect, Qualified, Submission, Win (ordered).
- **BCG mapping & probability:** F0–F5 mapping aligns with funnel probabilities and definitions.
- **KPI set (weekly/monthly):** volume by stage, conversion rates, cycle time/aging, top source/city, Win Rate, RKAP/STG attainment; Qualified LOP = Qualified+Submission+Win.

## 6. User Stories (MVP)

- As Marketing/Sales, I can upload a CSV/Excel and see its processing status (QUEUED → RUNNING → SUCCESS/FAILED) and logs.
- As an Analyst, I can open `/dashboard` to see five KPI stage cards (two rows), switch segment tabs, set date range, and click into drilldown.
- As Admin, I can ensure only my tenant’s data is visible and contributors can insert while RLS protects reads/updates.

## 7. Requirements

### Functional

- **Uploads & Status:** `POST /api/imports`; `GET /api/imports/:id` → status + links to clean.csv/.xlsx/log.
- **KPI API:** `GET /api/funnel-2rows?from=&to=&segment=` → two-row metrics per stage from the SQL view.
- **Dashboard UI:** segment tabs; five two-row cards; drilldown table by stage.

### Data/ETL

- **Canonicalization:** column aliases → canonical names; normalize company/project; stage mapping; source priority BIDDING→MSDC→SALES→MARKETING→OTHER; dedupe per (company_name, project_name) with timestamp fallback.
- **Script defaults:** header at row 3, env vars `EXCEL_PATH`/`OUTPUT_DIR`/`SHEET_NAME`/`HEADER_ROW_ONE_BASED`.
- **Output artifacts for audit:** CSV/XLSX/Parquet with validation summary.

### Security & RLS

- Enable RLS on key tables; SELECT restricted by tenant claim; write policies for admin/contributor; ETL runs with service role.

### Non-Functional

- **Performance:** KPI endpoint must serve in &lt;250ms for typical ranges (view aggregates only).
- **Scalability:** Supabase Free for pilot, upgrade path documented (cost table).
- **Reliability:** Idempotent upserts (unique canonical keys).

## 8. Data Model (MVP)

- **Dimension & membership:** `tenants`, `users`, `memberships` (role enum).
- **Staging:** `imports`, `stg_raw_rows` (json), `stg_clean_rows` (canonical columns).
- **Final:** `companies` (name/name_canonical), `opportunities` (project/project_name_canonical, stage, amount, source_division).
- **(Optional):** `opportunity_stage_history`; `activities`; `leads` (thin).

## 9. Acceptance Criteria

1. Uploading a valid Excel produces SUCCESS, fills `stg_*`, and upserts at least one `opportunities` row.
2. Dashboard shows five stage cards with correct `value_M` & `projects`, including Qualified LOP metrics, per chosen segment.
3. RLS prevents cross-tenant reads in SQL Console and from the app.

## 10. Risks & Mitigations

- **Inconsistent headers across divisions** → Alias dictionary, editable in DB/UI.
- **Duplicates** → Canonical keys + dedupe policy in ETL.
- **Tenant isolation** → JWT claims/policies enforced.

## 11. Timeline & Costs (Pilot)

Vercel Hobby + Supabase Free + Cron = Rp0 monthly; domain ~Rp200k/year; documented upgrade path.
