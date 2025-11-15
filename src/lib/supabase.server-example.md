# Server-Side Supabase Usage Example

> **Status:** Reference documentation, not a runnable file.  
> **Location:** `src/lib/supabase.server-example.md`

This document shows how to use `createServerClient()` in server-only contexts.

## Route Handler Example

Use `createServerClient()` in Next.js route handlers (API endpoints). The service role key is **never** bundled into the client.

**File:** `src/app/api/companies/route.ts`

```typescript
import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // createServerClient() safely reads SUPABASE_SERVICE_ROLE_KEY from process.env
  // This code runs on the server only and is never sent to the client.
  const supabase = createServerClient();

  try {
    // Fetch companies for the authenticated tenant
    const { data, error } = await supabase.from("companies").select("*").eq("tenant_id", "some-tenant-id"); // RLS policy enforces this

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  try {
    // Insert with service role, RLS still applies
    const { data, error } = await supabase.from("companies").insert([body]).select();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
```

## Server Component Example

You can also use `createServerClient()` in Next.js Server Components (default):

**File:** `src/app/dashboard/companies-list.tsx`

```typescript
// No 'use client' directive — this is a Server Component by default
import { createServerClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export async function CompaniesList() {
  const supabase = createServerClient()

  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .limit(10)

  if (error) {
    return <div>Error loading companies: {error.message}</div>
  }

  return (
    <div>
      <h1>Companies</h1>
      <ul>
        {(companies || []).map((company: Database['public']['Tables']['companies']['Row']) => (
          <li key={company.id}>{JSON.stringify(company)}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Cron Job / Background Worker Example

For scheduled tasks or background workers, use `createServerClient()` similarly:

```typescript
// pages/api/cron/sync-imports.ts
import { createServerClient } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret if needed
  if (req.headers["authorization"] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabase = createServerClient();

  try {
    // Fetch pending imports and process them
    const { data: imports, error } = await supabase.from("imports").select("*").eq("status", "QUEUED");

    if (error) throw error;

    // Process each import...
    for (const imp of imports || []) {
      // ETL logic here
      console.log(`Processing import: ${imp.id}`);
    }

    return res.status(200).json({ processed: imports?.length || 0 });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
}
```

## Key Differences

| Context              | Function               | Secret Key                    | Example                         |
| -------------------- | ---------------------- | ----------------------------- | ------------------------------- |
| **Client Component** | `createClient()`       | NEXT_PUBLIC_SUPABASE_ANON_KEY | React hooks, event handlers     |
| **Server Component** | `createServerClient()` | SUPABASE_SERVICE_ROLE_KEY     | Page rendering, data fetching   |
| **Route Handler**    | `createServerClient()` | SUPABASE_SERVICE_ROLE_KEY     | `GET /api/...`, `POST /api/...` |
| **Background Job**   | `createServerClient()` | SUPABASE_SERVICE_ROLE_KEY     | Cron, queues, workers           |

## Security Checklist

- ✅ `createServerClient()` is **never** called in `'use client'` components
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the browser
- ✅ Imports from `@/lib/supabase` are tree-shakeable (only what you use is bundled)
- ✅ RLS policies still enforce row-level security even with service role
- ✅ Route handlers validate auth / CRON secrets before executing sensitive operations
