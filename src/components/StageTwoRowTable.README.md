# StageTwoRowTable Component & Dashboard

## Overview

The dashboard displays a sales funnel KPI grid showing metrics across 5 stages (Leads, Prospect, Qualified, Submission, Win) plus an aggregated "Qualified LOP" block.

## Files

| File | Purpose |
|------|---------|
| `src/components/StageTwoRowTable.tsx` | Reusable grid component, renders 5×2 stage cells + LOP block |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard page (RSC), fetches API data, renders StageTwoRowTable |
| `src/app/funnel/page.tsx` | Stage detail drilldown page (TODO: implement) |

## Component: StageTwoRowTable

### Props

```typescript
interface StageTwoRowTableProps {
  stages: FunnelStageRow[]      // Array of 6 stages (including qualified_lop)
  segment: string                // Current segment name (e.g., "Total", "Telkom Group")
  from?: string                  // ISO datetime start (for query params)
  to?: string                    // ISO datetime end (for query params)
}
```

### Features

✅ **Two-row cells per stage:**
- Row 1: Formatted currency (`Rp 150,50 M`)
- Row 2: Project count (`45 prj`)

✅ **Responsive grid:**
- Small (sm): 2 columns
- Medium (md): 5 columns

✅ **Qualified LOP block:**
- Aggregates Qualified + Submission + Win
- Separate section with green hover highlight

✅ **Accessible:**
- Semantic HTML (article, section, h2, h3)
- All links keyboard-navigable
- Screen reader friendly

✅ **Interactive:**
- Hover effects (shadow, ring, arrow indicator)
- Click navigates to `/funnel?stage=...&segment=...&from=...&to=...`

### Formatting Functions

```typescript
formatCurrency(150.5)  // → "Rp 150,50 M"
formatProjects(45)     // → "45 prj"
```

### Example Usage

```typescript
import { StageTwoRowTable } from '@/components/StageTwoRowTable'

export function Dashboard() {
  const data = {
    segment: 'Total',
    stages: [
      { stage: 'leads', value_m: 150.5, projects: 45 },
      { stage: 'prospect', value_m: 120.3, projects: 30 },
      // ... more stages
      { stage: 'qualified_lop', value_m: 221.0, projects: 45 }
    ]
  }

  return (
    <StageTwoRowTable
      stages={data.stages}
      segment={data.segment}
      from="2025-11-01T00:00:00Z"
      to="2025-11-30T23:59:59Z"
    />
  )
}
```

## Page: Dashboard (`/dashboard`)

### Type: Server Component (RSC)

Fetches funnel data server-side and renders the component.

### Query Parameters

```
/dashboard?segment=Total&from=2025-11-01T00:00:00Z&to=2025-11-30T23:59:59Z
```

| Param | Type | Example |
|-------|------|---------|
| `segment` | string | `Total`, `Telkom Group`, `SOE` |
| `from` | ISO datetime | `2025-11-01T00:00:00Z` |
| `to` | ISO datetime | `2025-11-30T23:59:59Z` |

### Fetch Behavior

- Uses `fetch(..., { cache: 'no-store' })` for always-fresh data
- Catches API errors and displays error card
- Wraps content in `<Suspense>` with loading skeleton

### Error Handling

**API Error (400/404/500):**
```json
{
  "error": "Failed to load funnel data",
  "details": "Invalid query parameters"
}
```
→ Displays error card with message

**Network Error:**
→ Caught and displayed in error card

### TODO

- [ ] Extract tenant_id from auth context (currently mock)
- [ ] Implement segment tabs component
- [ ] Implement date range picker
- [ ] Add caching strategy (consider SWR/Redis)

## Page: Stage Detail (`/funnel?stage=...`)

### Query Parameters

```
/funnel?stage=leads&segment=Total&from=2025-11-01T00:00:00Z&to=2025-11-30T23:59:59Z
```

### TODO

- [ ] Fetch opportunities for the stage
- [ ] Render filterable data table
- [ ] Show conversion metrics
- [ ] Display stage timing/aging
- [ ] Export to CSV

## Styling

- **Framework:** Tailwind CSS
- **Components:** shadcn/ui Card
- **Utilities:** Custom formatting functions (currency, projects)

### Responsive Breakpoints

| Breakpoint | Grid Columns | Gap |
|------------|--------------|-----|
| sm (< 768px) | 2 | 0.75rem |
| md (≥ 768px) | 5 | 1rem |

### Colors

- **Default:** Gray theme (`text-gray-900`, `bg-gray-200`)
- **Stage hover:** Blue ring (`ring-blue-400`)
- **LOP hover:** Green ring (`ring-green-400`)
- **Error:** Red text (`text-red-600`)

## Accessibility

✅ **WCAG 2.1 Level AA:**
- Semantic HTML structure
- Proper heading hierarchy (h1 > h2 > h3)
- All interactive elements keyboard-navigable
- Color contrast meets standards
- Descriptive link text (stage names)

✅ **Screen Reader:**
- Section landmarks
- Article container
- Heading context for values

## Testing

### Manual Testing

1. **Render check:**
   ```bash
   npm run dev
   open http://localhost:3000/dashboard
   ```

2. **Load API data:**
   - Should show 6 stage blocks
   - Values formatted as currency
   - Projects formatted as count

3. **Responsive test:**
   - Mobile (320px): 2 columns
   - Tablet (768px): 5 columns

4. **Navigation test:**
   - Click a stage → navigate to `/funnel?stage=...`
   - Click LOP block → navigate to `/funnel?stage=qualified_lop`

5. **Accessibility test:**
   - Use Tab to navigate links
   - Use screen reader (NVDA/JAWS) to verify structure

### Unit Tests (TODO)

```typescript
// Test formatCurrency
expect(formatCurrency(150.5)).toBe('Rp 150,50 M')

// Test formatProjects
expect(formatProjects(45)).toBe('45 prj')

// Test component rendering
render(<StageTwoRowTable stages={mockStages} segment="Total" />)
expect(screen.getByText('leads')).toBeInTheDocument()
```

## Performance

- **Server-side fetch:** No client JavaScript for data loading
- **Suspense boundary:** Shows skeleton while loading
- **No-store cache:** Forces fresh data (can add Redis layer later)
- **Tree-shaking:** Unused utilities removed by bundler

## Future Enhancements

1. **Caching:**
   - Add Redis/Memcached layer
   - Cache 5-min for dashboards
   - Invalidate on data updates

2. **Real-time updates:**
   - WebSocket subscription to opportunities table
   - Live KPI updates

3. **Segmentation:**
   - Tabs for segment switching
   - URL state sync

4. **Date picker:**
   - Calendar component for date range
   - Preset ranges (today, this week, this month)

5. **Drilldown:**
   - Opportunities table with sorting/filtering
   - Stage transition analytics
   - Export to CSV/Excel

6. **Dashboard layout:**
   - Multiple dashboard variants (exec, sales, ops)
   - Customizable card order
   - Dark mode support
