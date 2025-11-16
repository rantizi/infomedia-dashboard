# GET /api/funnel-2rows

Fetch KPI metrics for the sales funnel by stage and segment.

## Overview

This endpoint queries the `vw_funnel_kpi_per_segment` view to return a 5×2 (five stages × two metrics) table suitable for dashboard display. Each stage row contains:
- **value_m:** Aggregated value in millions
- **projects:** Count of opportunities

Stages returned: `leads`, `prospect`, `qualified`, `submission`, `win`, plus `qualified_lop` (qualified + submission + win aggregated).

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tenant_id` | string | ✅ Yes | — | Tenant identifier (mock for now; TODO: derive from JWT) |
| `segment` | string | ❌ No | `"Total"` | Segment name (e.g., "Telkom Group", "SOE", "SME") |
| `from` | ISO datetime | ❌ No | — | Start date for filtering (inclusive) |
| `to` | ISO datetime | ❌ No | — | End date for filtering (inclusive) |

## Request Examples

### Basic Request (All Segments, All Time)
```bash
GET /api/funnel-2rows?tenant_id=acme-corp&segment=Total
```

### With Date Range
```bash
GET /api/funnel-2rows?tenant_id=acme-corp&segment=Total&from=2025-01-01T00:00:00Z&to=2025-12-31T23:59:59Z
```

### Specific Segment
```bash
GET /api/funnel-2rows?tenant_id=acme-corp&segment=Telkom%20Group
```

## Response Shape

### Success (200 OK)
```json
{
  "segment": "Total",
  "stages": [
    { "stage": "leads", "value_m": 150.5, "projects": 45 },
    { "stage": "prospect", "value_m": 120.3, "projects": 30 },
    { "stage": "qualified", "value_m": 95.8, "projects": 20 },
    { "stage": "submission", "value_m": 75.2, "projects": 15 },
    { "stage": "win", "value_m": 50.0, "projects": 10 },
    { "stage": "qualified_lop", "value_m": 221.0, "projects": 45 }
  ]
}
```

### Error: Missing Required Parameter (400)
```json
{
  "error": "Invalid query parameters",
  "details": "Required: tenant_id (string). Optional: from, to (ISO datetime), segment (string, default \"Total\")"
}
```

### Error: Invalid Date Format (400)
```json
{
  "error": "Invalid query parameters",
  "details": "from and to must be valid ISO datetime strings"
}
```

### Error: No Data Found (404)
```json
{
  "error": "No data found for the given segment and tenant"
}
```

### Error: Database Error (500)
```json
{
  "error": "Failed to fetch funnel data",
  "message": "[only in development] Database connection failed"
}
```

## HTTP Status Codes

| Code | Reason |
|------|--------|
| 200 | Success, data returned |
| 400 | Invalid query parameters (validation failed) |
| 404 | No data found for segment/tenant combination |
| 500 | Server error (database issue, etc.) |

## Testing in cURL

```bash
# Basic test
curl "http://localhost:3000/api/funnel-2rows?tenant_id=test-tenant&segment=Total"

# With date range
curl "http://localhost:3000/api/funnel-2rows?tenant_id=test-tenant&segment=SOE&from=2025-11-01T00:00:00Z&to=2025-11-30T23:59:59Z"

# Missing tenant_id (should error)
curl "http://localhost:3000/api/funnel-2rows?segment=Total"
```

## Implementation Notes

- **Edge-safe:** Uses only standard `NextRequest`/`NextResponse` APIs, no Node-specific globals
- **Validation:** Zod schema enforces required fields and ISO datetime format
- **Error handling:** Distinct 400 (validation), 404 (not found), 500 (server) responses
- **Database queries:** Uses Supabase service role for unrestricted query access
- **Optional filtering:** Date ranges are applied only if provided

## Future Enhancements

- [ ] Extract `tenant_id` from JWT claims instead of query parameter
- [ ] Add caching layer for frequently-accessed segments
- [ ] Support multi-segment aggregation in single request
- [ ] Add response schema validation (Zod output schema)
- [ ] Structured logging with correlation IDs

