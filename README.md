
# README.md (developer-oriented)

## Documentation
- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture Overview](docs/architecture.md)

## Project Setup

### Clone
```bash
git clone https://github.com/rantizi/infomedia-dashboard.git
cd infomedia-dashboard
```

### Stack
- Next.js (App Router)
- Tailwind
- shadcn/ui
- Supabase client/server SDKs

### Install
```bash
pnpm i
```

## Environment Variables

Create `.env.local` in the repo root (or copy `.env.example` once it exists) and define the keys below before running the app:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for the dashboard to query |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key used by the Next.js client |
| `SUPABASE_SERVICE_ROLE_KEY` | Secure service-role key for server-side imports/ETL |
| `SUPABASE_ETL_WEBHOOK_SECRET` | Secret shared with cron/worker to trigger ETL runs |

Keep secrets out of source control. Extend this list as new integrations (analytics, feature flags, etc.) are added per PRD/architecture.

### Migrations
Run SQL in `supabase/migrations/` (includes enums, tables, indexes, KPI view). Apply RLS in `supabase/policies.sql`.

---

## Running Locally
```bash
pnpm dev
```  
in `apps/web/`.

- Ensure `.env.local` contains the Supabase URL and anon/service keys (see _Environment Variables_)
- Login to create initial tenant/membership
- Open `/imports` to test an upload
- Check the imports status and ETL outputs

---

## ETL Worker

**Code:** `packages/etl/etl_clean_loop.py`

**Envs:**
- `EXCEL_PATH`
- `OUTPUT_DIR`
- `SHEET_NAME`
- `HEADER_ROW_ONE_BASED`

**Behavior:** Read workbook (header row 3 by default), alias → canonical, normalize, dedupe by source priority + timestamp, export CSV/XLSX/Parquet.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/imports` | Create import + store file |
| `GET` | `/api/imports/:id` | Status and artifact links |
| `GET` | `/api/funnel-2rows` | KPI for two-row stage table |

**Query params:** `?from=&to=&segment=`

---

## Coding Standards

- TypeScript everywhere, strict mode
- Clean separation:
  - `app/` routes
  - `components/` UI
  - `lib/` data helpers
  - `packages/etl` isolated worker
  - SQL in `supabase/migrations`
- Testing: unit tests for parsing/normalization; component tests for KPI cards

---

## Security

- RLS must be enabled
- SELECT constrained by tenant
- Writes restricted
- ETL uses service role
- Verify with SQL policies in `supabase/policies.sql`

---

## How I got here (quick rationale)

I mapped your funnel definitions, stage order, and KPI/segment needs to concrete DB tables, SQL view, and two-row cards, using your v5 spec and database notes. I aligned the PRD/architecture to your ETL script’s canonicalization and dedupe logic so the pipeline is consistent end-to-end. I enforced multi-tenant RLS and listed practical policies per your RLS examples.

---

## Alternative approaches to consider

1. **Streamlit/Supabase Studio for MVP**
   - Faster validation, but weaker UX control
2. **Server-only ETL via Edge Functions in Supabase**
   - Cut GitHub Actions, at the cost of Python portability
3. **Data warehouse (BigQuery) if volume grows**
   - Keep the same ingestion spec and swap the view

---

## Action plan (immediately doable)

1. Create Supabase project
2. Run migrations & policies
3. Seed tenants/users/memberships
4. Scaffold three endpoints under `app/api/`:
   - `imports`
   - `imports/[id]`
   - `funnel-2rows`
5. Build `SegmentTabs` & `StageTwoRowTable` and wire to `/api/funnel-2rows`
6. Hook up ETL runner (local or CI/Cron) and verify a sample upload end-to-end
