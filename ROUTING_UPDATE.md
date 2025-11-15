# Routing Update - Infomedia Dashboard as Default

## Problem

When accessing `localhost:3000`, the template's default dashboard was showing instead of the Infomedia funnel dashboard.

## Root Cause

The root page (`/`) was redirecting to `/dashboard/default` (template's analytics dashboard) instead of `/dashboard` (Infomedia funnel dashboard).

## Changes Made

### 1. Updated Root Redirect

**File**: `src/app/(external)/page.tsx`

```typescript
// Before:
redirect("/dashboard/default");

// After:
redirect("/dashboard");
```

Now `localhost:3000` → redirects to → `localhost:3000/dashboard` (Infomedia funnel dashboard)

### 2. Added to Sidebar Navigation

**File**: `src/navigation/sidebar/sidebar-items.ts`

Added "Overview" as the first dashboard option:

```typescript
{
  title: "Overview",
  url: "/dashboard",
  icon: TrendingUp,
  isNew: true,  // Shows "NEW" badge
}
```

## Result

### Now When You Access:

**`localhost:3000`** → Shows Infomedia Dashboard with:

- ✅ 6 segment columns (Telkom Group, SOE, Private, Gov, SME & Reg, Total)
- ✅ 5 funnel rows (Leads, Prospects, Qualified, Submissions, Win)
- ✅ Each cell with 2 lines: value in millions + project count
- ✅ Target RKAP and STG sections
- ✅ Kecukupan LOP and Qualified LOP sections

### Sidebar Navigation:

```
Dashboards
  📈 Overview (NEW) ← Infomedia funnel dashboard
  📊 Default       ← Template analytics dashboard
  📈 CRM
  💰 Finance
  ...
```

## All Routes:

| URL                  | Description                            |
| -------------------- | -------------------------------------- |
| `/`                  | Redirects to `/dashboard`              |
| `/dashboard`         | **Infomedia Overview Dashboard** (NEW) |
| `/dashboard/default` | Template's analytics dashboard         |
| `/dashboard/crm`     | Template's CRM dashboard               |
| `/dashboard/finance` | Template's finance dashboard           |

## Testing

1. **Access root URL**:

   ```
   http://localhost:3000
   ```

   ✅ Should show Infomedia funnel dashboard

2. **Click "Overview" in sidebar**:
   ✅ Should navigate to Infomedia funnel dashboard

3. **Click "Default" in sidebar**:
   ✅ Should navigate to template's analytics dashboard

## What You Should See

When you access `localhost:3000`, you should now see:

```
┌─────────────────────────────────────────────────────────────┐
│ Overview                       [Segment Tabs: 6 buttons]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FUNNEL TABLE (5 rows × 6 segments)                        │
│  ┌─────────┬──────────┬─────┬──────────┬──────┬─────┬─────┐│
│  │Stage    │Telkom G  │ SOE │ Private  │ Gov  │SME&R│Total││
│  ├─────────┼──────────┼─────┼──────────┼──────┼─────┼─────┤│
│  │[Leads]  │ 18,45 M  │ ... │   ...    │  ... │ ... │ ... ││
│  │         │ 26 projek│ ... │   ...    │  ... │ ... │ ... ││
│  └─────────┴──────────┴─────┴──────────┴──────┴─────┴─────┘│
│                                                              │
│  TARGET RKAP & STG                                          │
│  KECUKUPAN LOP                                              │
│  QUALIFIED LOP                                              │
└─────────────────────────────────────────────────────────────┘
```

Instead of the analytics dashboard you showed in the screenshot.

## Quick Navigation

- **Infomedia Dashboard**: `localhost:3000/dashboard` or just `localhost:3000`
- **Template Dashboard**: `localhost:3000/dashboard/default`

## Files Modified

1. ✅ `src/app/(external)/page.tsx` - Updated redirect
2. ✅ `src/navigation/sidebar/sidebar-items.ts` - Added Overview to sidebar

No linter errors. Build successful. ✅
