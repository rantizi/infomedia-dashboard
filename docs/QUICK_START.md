# Quick Start Guide - Overview Dashboard

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to Dashboard

Open your browser and go to:

```
http://localhost:3000/dashboard
```

You should see the complete Overview dashboard with all funnel metrics!

## 📂 Project Structure

```
src/
├── types/
│   └── funnel.ts                         # 📝 Type definitions
├── app/
│   ├── api/funnel-2rows/
│   │   ├── route.ts                      # 🔌 API endpoint
│   │   └── stub-data.ts                  # 📊 Mock data
│   └── (main)/dashboard/
│       └── page.tsx                      # 📄 Main page
└── components/funnel/
    ├── SegmentTabs.tsx                   # 🔘 Segment selector
    ├── FunnelTable.tsx                   # 📊 Main funnel table
    ├── TargetBlocks.tsx                  # 🎯 RKAP/STG targets
    ├── LopBlocks.tsx                     # 📈 LOP metrics
    └── OverviewDashboard.tsx             # 🎛️ Main component
```

## 🎨 What You'll See

### Header Section

```
┌─────────────────────────────────────────────────────────────┐
│ Overview                       [Telkom G] [SOE] [Private]   │
│ Sales funnel dashboard         [Gov] [SME & Reg] [Total]    │
└─────────────────────────────────────────────────────────────┘
```

### Funnel Table (5 stages × 6 segments)

```
┌───────────┬─────────┬─────┬─────────┬─────┬──────────┬───────┐
│ Stage     │Telkom G │ SOE │ Private │ Gov │ SME & Reg│ Total │
├───────────┼─────────┼─────┼─────────┼─────┼──────────┼───────┤
│ [Leads]   │ 18,45 M │ ... │   ...   │ ... │   ...    │  ...  │
│           │26 projek│ ... │   ...   │ ... │   ...    │  ...  │
├───────────┼─────────┼─────┼─────────┼─────┼──────────┼───────┤
│[Prospects]│ 15,23 M │ ... │   ...   │ ... │   ...    │  ...  │
│           │22 projek│ ... │   ...   │ ... │   ...    │  ...  │
└───────────┴─────────┴─────┴─────────┴─────┴──────────┴───────┘
... (3 more stages)
```

### Target Blocks

```
┌────────────┬─────────┬─────┬─────────┬─────┬──────────┬───────┐
│ Target RKAP│120,00 M │80,00│ 150,00 M│95,00│  60,00 M │505,00 │
│ Target STG │100,00 M │65,00│ 125,00 M│78,00│  50,00 M │418,00 │
└────────────┴─────────┴─────┴─────────┴─────┴──────────┴───────┘
```

### LOP Blocks (2 sections, each with 3 rows)

```
Kecukupan LOP:
┌──────────────┬─────────┬─────┬─────────┬─────┬──────────┬───────┐
│ Nilai        │ 30,69 M │ ... │   ...   │ ... │   ...    │  ...  │
│ % RKAP       │ 25,58%  │ ... │   ...   │ ... │   ...    │  ...  │
│ % STG        │ 30,69%  │ ... │   ...   │ ... │   ...    │  ...  │
└──────────────┴─────────┴─────┴─────────┴─────┴──────────┴───────┘

Qualified LOP:
└──────────────┴─────────┴─────┴─────────┴─────┴──────────┴───────┘
(Same structure)
```

## 🔧 Common Tasks

### Modifying Stub Data

Edit `src/app/api/funnel-2rows/stub-data.ts`:

```typescript
export const STUB_FUNNEL_DATA: Funnel2RowsResponse = {
  stages: {
    leads: {
      TELKOM_GROUP: { valueM: 18.45, projects: 26 }, // ← Change these
      // ...
    },
  },
  // ...
};
```

### Adding New Components

1. Create component in `src/components/funnel/MyComponent.tsx`
2. Export from `src/components/funnel/index.ts`
3. Import in `OverviewDashboard.tsx`:
   ```typescript
   import { MyComponent } from "./MyComponent";
   ```

### Styling Changes

All components use Tailwind CSS. Example:

```typescript
// Change cell background
<div className="bg-blue-50 px-4 py-3">  // ← Modify classes
```

### Number Format Changes

Edit format functions in each component:

```typescript
function formatValueM(value: number): string {
  return `${value.toLocaleString("id-ID", {
    // ← Change locale
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
}
```

## 🔌 Integrating Real Data

### Step 1: Update API Route

In `src/app/api/funnel-2rows/route.ts`:

```typescript
export async function GET(): Promise<NextResponse> {
  try {
    // Replace this:
    // return NextResponse.json(STUB_FUNNEL_DATA, { status: 200 })

    // With this:
    const supabase = createServerClient();
    const { data, error } = await supabase.from("vw_funnel_kpi_per_segment").select("*");

    if (error) throw error;

    // Transform data to Funnel2RowsResponse format
    const transformedData = transformSupabaseData(data);

    return NextResponse.json(transformedData, { status: 200 });
  } catch (error) {
    // ... error handling
  }
}
```

### Step 2: Create Transform Function

```typescript
function transformSupabaseData(rows: any[]): Funnel2RowsResponse {
  // Map database rows to Funnel2RowsResponse structure
  // Implementation depends on your view structure
}
```

### Step 3: Add Query Parameters

Update API to accept filters:

```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const segment = searchParams.get("segment") || "TOTAL";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Use in query...
}
```

### Step 4: Update Client

In `OverviewDashboard.tsx`:

```typescript
useEffect(() => {
  async function fetchData() {
    const params = new URLSearchParams({
      segment: selectedSegment,
      // Add date filters if needed
    });

    const response = await fetch(`/api/funnel-2rows?${params}`);
    // ...
  }

  fetchData();
}, [selectedSegment]); // ← Re-fetch when segment changes
```

## 🎯 Key Files Reference

### Types (`src/types/funnel.ts`)

```typescript
import { Segment, FunnelStage, Funnel2RowsResponse } from "@/types/funnel";
```

### Components (`src/components/funnel/`)

```typescript
import { SegmentTabs, FunnelTable, TargetBlocks, LopBlocks } from "@/components/funnel";
```

### API Endpoint

```
GET /api/funnel-2rows
Response: Funnel2RowsResponse
```

## 🐛 Troubleshooting

### Dashboard Not Loading

1. Check console for errors: Open DevTools (F12) → Console tab
2. Verify API is returning data: Visit `http://localhost:3000/api/funnel-2rows`
3. Check network tab: Should see 200 response

### Styling Issues

1. Ensure Tailwind CSS is working: Check if other pages render correctly
2. Clear cache: Hard refresh (Ctrl+Shift+R)
3. Rebuild: Stop server, `npm run dev` again

### TypeScript Errors

1. Run type check: `npm run build`
2. Check imports: Ensure all paths are correct
3. Verify types: `import type { ... } from "@/types/funnel"`

## 📚 Further Reading

- **Architecture Details**: See `docs/OVERVIEW_DASHBOARD.md`
- **Component Hierarchy**: See `docs/COMPONENT_HIERARCHY.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`
- **PRD**: See `docs/PRD.md`
- **Database Schema**: See `docs/architecture.md`

## ✅ Verification Checklist

Run through this to verify everything is working:

- [ ] Dashboard loads at `/dashboard`
- [ ] Segment tabs render and are clickable
- [ ] Funnel table shows 5 stages × 6 segments
- [ ] Each cell has 2 lines (value + projects)
- [ ] Target RKAP and STG rows display
- [ ] Kecukupan LOP section shows 3 rows
- [ ] Qualified LOP section shows 3 rows
- [ ] Numbers use Indonesian format (18,45 M)
- [ ] Stage pills have different colors
- [ ] Page is responsive (test on mobile width)
- [ ] Loading skeleton appears briefly
- [ ] No console errors

## 🎉 Success!

If all items are checked, your Overview dashboard is fully functional!

Next steps:

1. Customize stub data to match your needs
2. Integrate with real Supabase data when ready
3. Add additional features (filters, exports, etc.)
