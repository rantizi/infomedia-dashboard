import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// TODO: Consolidate with src/lib/supabaseClient.ts so there is a single set of helpers.

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in environment. " + "Please set it in your .env.local file (see .env.example).",
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment. " +
        "Please set it in your .env.local file (see .env.example).",
    );
  }

  try {
    return createSupabaseClient<Database>(url, anonKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize Supabase client: ${message}. ` +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are valid.",
    );
  }
}

/**
 * Create a Supabase client for use in server-side code (Server Components,
 * Server Actions, Route Handlers) that properly handles auth cookies.
 *
 * This uses @supabase/ssr to create a client that reads and writes auth
 * cookies using Next.js cookies() API. This is essential for authentication
 * to work correctly in server actions and server components.
 *
 * Use this in Server Components, Server Actions, and Route Handlers where
 * you need to access the authenticated user's session.
 *
 * @throws {Error} if required env vars are missing.
 *
 * @example
 *   // In a Server Component or Server Action
 *   const supabase = createServerClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createServerClient(): Promise<SupabaseClient<Database>> {
  const { createServerClient: createSSRClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL in environment. " + "Please set it in your .env.local file (see .env.example).",
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in environment. " +
        "Please set it in your .env.local file (see .env.example).",
    );
  }

  const cookieStore = await cookies();

  try {
    return createSSRClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore errors from setting cookies in Server Components
            // This is expected when rendering, cookies should be set in Server Actions
          }
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize Supabase server client: ${message}. ` +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are valid.",
    );
  }
}

/**
 * Create a Supabase client using the service role key.
 * Use only on the server for privileged operations (ETL, backfills, admin tasks).
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment. This key must never be exposed to the client.");
  }

  try {
    return createSupabaseClient<Database>(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to initialize Supabase service role client: ${message}`);
  }
}

export type { SupabaseClient };
