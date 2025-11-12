# Supabase Integration Guide

This guide documents the Supabase client setup, file organization, and usage patterns for the infomedia-dashboard project.

## 📂 File Structure

All shared Supabase utilities live in `src/lib/` (mapped via `@/lib/*` in tsconfig):

```
src/lib/
├── supabase.ts                      # Main client helpers (createClient, createServerClient)
├── database.types.ts                # Generated Database type from Supabase schema
├── supabase.client-example.tsx      # ✅ Reference: Client component usage
└── supabase.server-example.md       # ✅ Reference: Server-side usage examples
```

**Why `src/lib/` and not `apps/web/lib/`?**
- The project's `tsconfig.json` aliases `@/*` → `./src/*`
- All shared, framework-agnostic code belongs in `src/lib/`
- Keeps the code tree shallow and import paths consistent across the app

## 🔧 Core Files

### `src/lib/supabase.ts`

Two main exports for different contexts:

#### **`createClient()`** — For Client Components
- **Where to use:** Inside `'use client'` components, hooks, event handlers
- **What it uses:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- **Safe because:** NEXT_PUBLIC_* env vars are inlined by Next.js at build time
- **Never call this:** In server components, route handlers, or any server-only code

```typescript
'use client'
import { createClient } from '@/lib/supabase'

export function MyComponent() {
  const supabase = createClient() // Fully typed with Database schema
  // Use supabase.from('table').select()...
}
```

#### **`createServerClient()`** — For Server-Side Code
- **Where to use:** Route handlers (`/api/*`), server components, cron jobs, background workers
- **What it uses:** `SUPABASE_SERVICE_ROLE_KEY` (SECRET, server-only)
- **Safe because:** Process.env is never bundled into the client by Next.js
- **Never expose this:** The service role key must never leak to the browser

```typescript
// No 'use client' — this is a server component or route handler
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient() // Uses service role internally
  const { data } = await supabase.from('companies').select('*')
  return Response.json({ data })
}
```

### `src/lib/database.types.ts`

Auto-generated TypeScript type for your Supabase schema. Includes all tables, views, and relationships:

```typescript
import type { Database } from '@/lib/database.types'

// Fully typed row access:
type Company = Database['public']['Tables']['companies']['Row']
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert']
```

## 🔑 Environment Variables

Set these in `.env.local` (never commit to git):

```bash
# Public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Secret (server-only, NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
SUPABASE_ETL_WEBHOOK_SECRET=your-webhook-secret
```

See `.env.example` for the template.

## 📚 Usage Examples

### ✅ Client Component with Data Fetching

**File:** `src/app/dashboard/companies-list.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export function CompaniesList() {
  const [companies, setCompanies] = useState<
    Database['public']['Tables']['companies']['Row'][]
  >([])
  const supabase = createClient()

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .limit(10)

      if (!error) setCompanies(data || [])
    }
    fetchCompanies()
  }, [supabase])

  return (
    <div>
      {companies.map((c) => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  )
}
```

### ✅ Server Component (No `'use client'`)

```typescript
// src/app/dashboard/page.tsx (Server Component by default)
import { createServerClient } from '@/lib/supabase'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .limit(10)

  return (
    <div>
      {companies?.map((c) => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  )
}
```

### ✅ Route Handler (API Endpoint)

**File:** `src/app/api/companies/route.ts`

```typescript
import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('companies')
    .insert([body])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
```

### ✅ Cron Job / Background Task

```typescript
// pages/api/cron/sync-imports.ts
import { createServerClient } from '@/lib/supabase'

export default async function handler(req: Request) {
  // Verify auth header if needed
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServerClient()
  const { data: imports } = await supabase
    .from('imports')
    .select('*')
    .eq('status', 'QUEUED')

  // Process imports...
  return Response.json({ processed: imports?.length || 0 })
}
```

## 🚨 Anti-Patterns (DO NOT DO)

```typescript
// ❌ WRONG: Calling createServerClient() in a client component
'use client'
const supabase = createServerClient() // ERROR: Security violation!

// ❌ WRONG: Hardcoding credentials
const supabase = createSupabaseClient('https://...', 'hardcoded-key')

// ❌ WRONG: Exposing service role key to browser
fetch('/api/init-db', {
  body: JSON.stringify({ serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY })
})

// ❌ WRONG: Using NEXT_PUBLIC_* in server code (it's already inlined at build time)
// These env vars are NOT available at runtime in the server
```

## 🔐 Security Checklist

- ✅ `SUPABASE_SERVICE_ROLE_KEY` is **only** accessible in server-side code (not in client bundles)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are inlined at build time
- ✅ RLS policies enforce row-level security even when using the service role
- ✅ Never import `createServerClient` in files with `'use client'` directive
- ✅ Validate input and verify user identity in route handlers before sensitive operations

## 📖 Reference Examples

- **Client Component Example:** `src/lib/supabase.client-example.tsx`
- **Server-Side Examples:** `src/lib/supabase.server-example.md`

## 🔄 Type Generation

To regenerate `database.types.ts` with the latest schema:

```bash
python d:\Codes\generate_db_types.py
```

This script:
1. Queries your Supabase REST API
2. Fetches the OpenAPI schema
3. Generates TypeScript types for all tables/views

Update the script with your actual Supabase credentials as needed.

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
- Run `pnpm install` to ensure dependencies are installed
- Clear `.next/` cache: `rm -rf .next`

### "SUPABASE_SERVICE_ROLE_KEY is undefined"
- Ensure the key is set in `.env.local` (not `.env`)
- The key is only available at runtime in server code, not at build time

### Type errors on Database tables
- Regenerate `database.types.ts` after making schema changes in Supabase
- Restart TypeScript server in your editor (`Cmd+Shift+P` → "TypeScript: Restart TS Server")

## 📝 Next Steps

1. Copy `.env.example` → `.env.local` and fill in your credentials
2. Test `createClient()` in a client component (dashboard page)
3. Test `createServerClient()` in a route handler (`/api/test`)
4. Gradually migrate existing data-fetching code to use these helpers
