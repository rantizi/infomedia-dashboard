# Overview Dashboard Implementation

## Overview

The Overview dashboard page displays the Infomedia sales funnel with comprehensive metrics across 6 customer segments and 5 funnel stages.

## Architecture

### Components

Located in `src/components/funnel/`:

1. **SegmentTabs** (`SegmentTabs.tsx`)
   - Renders 6 segment buttons: Telkom Group, SOE, Private, Gov, SME & Reg, Total
   - Manages segment selection state
   - Uses Tailwind CSS for styling with active state indicators

2. **FunnelTable** (`FunnelTable.tsx`)
   - Main funnel visualization table
   - Layout: 5 rows (stages) × 6 columns (segments) + label column
   - Each cell displays:
     - Top line: Value in millions (e.g., "18,45 M")
     - Bottom line: Project count (e.g., "26 projek")
   - Stage labels are colored pills (purple → blue → green → yellow → orange)
   - Responsive with horizontal scroll on mobile

3. **TargetBlocks** (`TargetBlocks.tsx`)
   - Displays two target rows:
     - Target RKAP (red label)
     - Target STG (grey label)
   - Shows values in millions for all 6 segments

4. **LopBlocks** (`LopBlocks.tsx`)
   - Two sections: Kecukupan LOP and Qualified LOP
   - Each section contains:
     - Value row (in millions)
     - % Terhadap RKAP (percentage vs RKAP target)
     - % Terhadap STG (percentage vs STG target)

5. **OverviewDashboard** (`OverviewDashboard.tsx`)
   - Client component that orchestrates all sections
   - Handles data fetching from `/api/funnel-2rows`
   - Manages loading and error states
   - Composes all dashboard sections

### Types

Located in `src/types/funnel.ts`:

```typescript
type FunnelStage = "leads" | "prospect" | "qualified" | "submission" | "win";
type Segment = "TELKOM_GROUP" | "SOE" | "PRIVATE" | "GOV" | "SME_REG" | "TOTAL";

interface FunnelCell {
  valueM: number;
  projects: number;
}

interface Funnel2RowsResponse {
  stages: { [K in FunnelStage]: { [S in Segment]: FunnelCell } };
  targetRkap: { [S in Segment]: number };
  targetStg: { [S in Segment]: number };
  kecukupanLop: { [S in Segment]: { valueM: number; pctRkap: number; pctStg: number } };
  qualifiedLop: { [S in Segment]: { valueM: number; pctRkap: number; pctStg: number } };
}
```

### API

**Endpoint**: `GET /api/funnel-2rows`

**Location**: `src/app/api/funnel-2rows/route.ts`

**Current Implementation**: Returns stub data from `stub-data.ts` matching the mockup numbers

**Future Implementation**: Will fetch from Supabase view `vw_funnel_kpi_per_segment`

**Response**: Complete `Funnel2RowsResponse` object with all segments data

### Page

**Location**: `src/app/(main)/dashboard/page.tsx`

Server component that renders the `OverviewDashboard` client component.

## Data Flow

1. User navigates to `/dashboard`
2. Page component renders `OverviewDashboard`
3. `OverviewDashboard` fetches data from `/api/funnel-2rows` on mount
4. API returns stub data (will be replaced with Supabase query)
5. Dashboard displays all sections with the fetched data
6. Segment tabs are rendered but currently show all data (future: filter by segment)

## Styling

- **Framework**: Tailwind CSS
- **Layout**: CSS Grid for table layouts (7 columns: 1 label + 6 segments)
- **Colors**:
  - Stage labels: Purple → Blue → Green → Yellow → Orange (funnel progression)
  - Target RKAP: Red label
  - Target STG: Grey label
  - Percentages: Blue (RKAP), Green (STG)
- **Responsive**:
  - Desktop: Full table width (min-width: 900px)
  - Mobile: Horizontal scroll for tables
  - Segment tabs: Wrap on small screens

## Number Formatting

All numbers use Indonesian locale formatting:

- **Currency**: `18,45 M` (comma as decimal separator, period as thousands separator)
- **Projects**: `26 projek`
- **Percentages**: `26,49%`

## Future Enhancements

1. **Real Data Integration**
   - Replace stub data with Supabase queries
   - Add authentication and tenant filtering
   - Implement date range filters

2. **Segment Filtering**
   - Make segment tabs functional to show single-segment view
   - Add API support for `?segment=...` query parameter

3. **Interactivity**
   - Click cells to drill down to project details
   - Add tooltips with additional metrics
   - Export data functionality

4. **Performance**
   - Add SWR or React Query for data caching
   - Implement optimistic updates
   - Add pagination for large datasets

## File Structure

```
src/
├── types/
│   └── funnel.ts                    # Type definitions
├── app/
│   ├── api/
│   │   └── funnel-2rows/
│   │       ├── route.ts             # API endpoint
│   │       └── stub-data.ts         # Mock data
│   └── (main)/
│       └── dashboard/
│           └── page.tsx             # Overview page
└── components/
    └── funnel/
        ├── index.ts                 # Barrel export
        ├── SegmentTabs.tsx          # Segment selector
        ├── FunnelTable.tsx          # Main funnel table
        ├── TargetBlocks.tsx         # RKAP/STG targets
        ├── LopBlocks.tsx            # LOP metrics
        └── OverviewDashboard.tsx    # Main dashboard component
```

## Testing

To test the implementation:

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard`

Expected result:

- Overview dashboard with "Overview" title
- Segment tabs at the top
- Funnel table with 5 stages × 6 segments
- Target RKAP and Target STG rows
- Kecukupan LOP section with 3 rows
- Qualified LOP section with 3 rows
- All numbers formatted in Indonesian style
- Responsive layout that works on desktop and mobile

## Notes

- All components are type-safe with no `any` types
- Components are composable and reusable
- Loading and error states are handled gracefully
- Code includes JSDoc comments for clarity
- Follows Next.js 16 App Router conventions
- Uses shadcn/ui primitives where appropriate
