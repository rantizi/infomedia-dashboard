# Component Hierarchy - Overview Dashboard

## Component Tree

```
Page (Server Component)
└── OverviewDashboard (Client Component)
    ├── Header Section
    │   ├── Title: "Overview"
    │   └── SegmentTabs
    │       └── Button Group (6 segments)
    │
    ├── FunnelTable
    │   ├── Header Row (6 segment labels)
    │   └── Stage Rows (5 stages)
    │       ├── StageLabel (colored pill)
    │       └── Data Cells (6 per row)
    │           ├── Value (bold, in millions)
    │           └── Projects (lighter text)
    │
    ├── TargetBlocks
    │   ├── Header Row (6 segment labels)
    │   ├── Target RKAP Row (red label + 6 values)
    │   └── Target STG Row (grey label + 6 values)
    │
    └── LopBlocks
        ├── Kecukupan LOP Section
        │   ├── Header Row (6 segment labels)
        │   ├── Value Row (Nilai)
        │   ├── Percentage Row (% Terhadap RKAP)
        │   └── Percentage Row (% Terhadap STG)
        │
        └── Qualified LOP Section
            ├── Header Row (6 segment labels)
            ├── Value Row (Nilai)
            ├── Percentage Row (% Terhadap RKAP)
            └── Percentage Row (% Terhadap STG)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                      User Browser                       │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Navigate to /dashboard
                            ▼
┌─────────────────────────────────────────────────────────┐
│           Page (Server Component)                       │
│   src/app/(main)/dashboard/page.tsx                     │
│                                                           │
│   - Renders OverviewDashboard                           │
│   - Provides container layout                           │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Renders
                            ▼
┌─────────────────────────────────────────────────────────┐
│      OverviewDashboard (Client Component)               │
│   src/components/funnel/OverviewDashboard.tsx           │
│                                                           │
│   - useEffect on mount                                  │
│   - Fetches data from API                               │
│   - Manages loading/error states                        │
│   - Holds segment selection state                       │
└─────────────────────────────────────────────────────────┘
                            │
                            │ fetch("/api/funnel-2rows")
                            ▼
┌─────────────────────────────────────────────────────────┐
│           API Route (Server Side)                       │
│   src/app/api/funnel-2rows/route.ts                     │
│                                                           │
│   - Returns stub data (STUB_FUNNEL_DATA)               │
│   - TODO: Replace with Supabase query                   │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Returns Funnel2RowsResponse
                            ▼
┌─────────────────────────────────────────────────────────┐
│      OverviewDashboard (Data Received)                  │
│                                                           │
│   - Passes data to child components                     │
└─────────────────────────────────────────────────────────┘
        │               │               │               │
        │               │               │               │
        ▼               ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
   │Segment  │   │ Funnel   │   │ Target   │   │  Lop    │
   │ Tabs    │   │  Table   │   │ Blocks   │   │ Blocks  │
   └─────────┘   └──────────┘   └──────────┘   └─────────┘
```

## Props Flow

```typescript
// SegmentTabs
interface SegmentTabsProps {
  value: Segment; // From: OverviewDashboard state
  onValueChange: (segment: Segment) => void; // To: Update state
}

// FunnelTable
interface FunnelTableProps {
  data: Funnel2RowsResponse; // From: API response
}

// TargetBlocks
interface TargetBlocksProps {
  data: Funnel2RowsResponse; // From: API response
}

// LopBlocks
interface LopBlocksProps {
  data: Funnel2RowsResponse; // From: API response
}
```

## State Management

### Current State (Overview Dashboard)

```typescript
const [selectedSegment, setSelectedSegment] = useState<Segment>("TOTAL");
```

Currently not used for filtering (shows all segments). Ready for future implementation.

### Data Fetching State

```typescript
const { data, loading, error } = useFunnelData();

// Returns:
// - data: Funnel2RowsResponse | null
// - loading: boolean
// - error: string | null
```

## CSS Grid Layout

All table components use consistent grid structure:

```css
grid-template-columns: 180px repeat(6, 1fr);
```

- **Column 1** (180px): Fixed width for labels
  - Stage pills (FunnelTable)
  - Target labels (TargetBlocks)
  - Row labels (LopBlocks)

- **Columns 2-7** (1fr each): Equal width for segments
  - Telkom Group
  - SOE
  - Private
  - Gov
  - SME & Reg
  - Total

## Responsive Behavior

### Desktop (≥900px)

- Full table layout visible
- All columns display side by side
- Comfortable spacing and padding

### Mobile (<900px)

- Horizontal scroll enabled
- Min-width: 900px enforced on tables
- Segment tabs wrap to multiple rows
- Container has overflow-x-auto

## Color Scheme

### Stage Pills (FunnelTable)

```typescript
const colorClasses = {
  leads: "bg-purple-500 text-white",
  prospect: "bg-blue-500 text-white",
  qualified: "bg-green-500 text-white",
  submission: "bg-yellow-500 text-white",
  win: "bg-orange-500 text-white",
};
```

### Target Labels (TargetBlocks)

```typescript
{
  red:  "bg-red-500 text-white",    // RKAP
  gray: "bg-gray-400 text-white",   // STG
}
```

### Percentages (LopBlocks)

```typescript
{
  pctRkap: "text-blue-600",   // % Terhadap RKAP
  pctStg:  "text-green-600",  // % Terhadap STG
}
```

### Segment Tabs

```typescript
{
  active:   "bg-blue-600 text-white shadow-md",
  inactive: "bg-white text-gray-700 shadow-sm hover:bg-gray-50",
}
```

## Number Formatting Functions

### formatValueM

```typescript
function formatValueM(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
}

// Examples:
// 18.45 → "18,45 M"
// 120.00 → "120,00 M"
```

### formatProjects

```typescript
function formatProjects(count: number): string {
  return `${count} projek`;
}

// Examples:
// 26 → "26 projek"
// 167 → "167 projek"
```

### formatPercent

```typescript
function formatPercent(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

// Examples:
// 25.58 → "25,58%"
// 30.69 → "30,69%"
```

## Loading States

### Skeleton Layout

```
┌─────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓ (Header skeleton)          │
├─────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  (Table skeleton - 384px height)      │
├─────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  (Targets skeleton - 128px height)    │
├─────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  (LOP skeleton - 256px height)        │
└─────────────────────────────────────────┘
```

## Error States

### Error Display

```
┌─────────────────────────────────────────┐
│  ⚠ Error Loading Data                  │
│                                          │
│  [Error message here]                   │
│                                          │
│  [ Retry Button ]                       │
└─────────────────────────────────────────┘
```

Click "Retry" → `window.location.reload()`
