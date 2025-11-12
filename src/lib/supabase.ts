import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Create a typed Supabase client for use in client components (browser).
 *
 * Use this in React client components (Client Components / useEffect, event
 * handlers) where the runtime is the browser and you must use the
 * NEXT_PUBLIC_* environment variables. Do NOT call this from server-only
 * code (API routes / route handlers / server components) — use
 * `createServerClient()` there.
 *
 * This helper is safe for client code because it reads only NEXT_PUBLIC
 * env vars which are inlined by Next.js and therefore available in the
 * browser bundle. It returns a SupabaseClient strongly typed with your
 * project's Database schema.
 *
 * @throws {Error} if required NEXT_PUBLIC env vars are missing at runtime.
 *
 * @example
 *   const supabase = createClient()
 *   const { data, error } = await supabase.from('companies').select('*')
 */
export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL in environment. ' +
      'Please set it in your .env.local file (see .env.example).'
    )
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment. ' +
      'Please set it in your .env.local file (see .env.example).'
    )
  }

  try {
    return createSupabaseClient<Database>(url, anonKey)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to initialize Supabase client: ${message}. ` +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are valid.'
    )
  }
}

/**
 * Create a Supabase client for use in server-side code (route handlers,
 * server components, or background workers) using the Service Role key.
 *
 * This must never be called from client code. The helper reads the
 * `SUPABASE_SERVICE_ROLE_KEY` from `process.env` and therefore will not be
 * bundled into the client. Do NOT reference `window` or other browser
 * globals in code that calls this function.
 *
 * Use this inside Next.js route handlers or any server-only module when you
 * need elevated privileges (for example, to bypass RLS for ETL or
 * administrative operations). Keep the service role key secret.
 *
 * @throws {Error} if required env vars are missing.
 *
 * @example
 *   const supabase = createServerClient()
 *   const { data, error } = await supabase.from('companies').select('*')
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL in environment. ' +
      'Please set it in your .env.local file (see .env.example).'
    )
  }

  if (!serviceRole) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in environment. ' +
      'This key must be set in .env.local (server-only, never expose to client). ' +
      'See .env.example for details.'
    )
  }

  try {
    return createSupabaseClient<Database>(url, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Failed to initialize Supabase server client: ${message}. ` +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are valid.'
    )
  }
}

export type { SupabaseClient }
